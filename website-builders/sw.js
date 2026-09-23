/**
 * Website Builders — Production Service Worker v1.0
 * Handles offline caching, PWA installation, and Web Push notifications.
 */

const CACHE_VERSION = 'wb-cache-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DATA_CACHE = `${CACHE_VERSION}-data`;

// Safe static assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/css/all.min.css',
  '/css/style.css',
  '/js/locales.js',
  '/images/logo.png',
  '/security'
];

// Sensitive URL patterns to NEVER cache
const SENSITIVE_PATTERNS = [
  /\/api\/login/,
  /\/api\/register/,
  /\/api\/auth/,
  /\/api\/admin\/2fa/,
  /\/api\/reset-password/,
  /\/api\/payments\/verify/,
  /\/api\/documents\/verify-otp/,
  /\/logout/
];

// Install Event - Precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache asset fetch warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('wb-cache-') && cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic routing and offline caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Never cache sensitive endpoints
  if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    return;
  }

  // Safe API calls (Projects, Tasks, Announcements) -> Network-First with Cache Fallback
  if (url.pathname.startsWith('/api/projects') || url.pathname.startsWith('/api/tasks') || url.pathname.startsWith('/api/announcements')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(JSON.stringify({
              success: true,
              data: [],
              isOffline: true,
              message: 'Viewing offline data. Reconnect to see latest updates.'
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Static Assets (CSS, JS, Images, Fonts) -> Cache-First with Network Fallback
  if (url.pathname.startsWith('/static/') || url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/') || url.pathname.startsWith('/images/') || url.pathname.startsWith('/webfonts/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation Requests (HTML pages) -> Network-First with Cache Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return caches.match('/customer/dashboard').then((dash) => dash || caches.match('/'));
        });
      })
    );
  }
});

// Push Event - Browser Web Push Notification Receiver
self.addEventListener('push', (event) => {
  let data = {
    title: 'Website Builders Update',
    body: 'You have a new project notification.',
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    url: '/customer/dashboard'
  };

  try {
    if (event.data) {
      data = Object.assign(data, event.data.json());
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/images/logo.png',
    badge: data.badge || '/images/logo.png',
    data: {
      url: data.url || '/customer/dashboard'
    },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'View Update' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Event - Deep linking to relevant section
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/customer/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
