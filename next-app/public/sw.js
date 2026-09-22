/**
 * Website Builders — Enterprise Production Service Worker
 * PWA Offline Caching & Web Push Notifications
 */

const CACHE_VERSION = 'wb-cache-v1';
const STATIC_CACHE = `wb-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `wb-dynamic-${CACHE_VERSION}`;

// Pre-cached core assets for application shell
const APP_SHELL_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/images/logo.png',
  '/logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon.svg',
];

// Sensitive routes and keywords that must NEVER be cached
const SENSITIVE_PATTERNS = [
  /\/api\/auth\//,
  /\/api\/admin\//,
  /\/api\/verify-payment/,
  /\/api\/create-order/,
  /\/api\/checkout/,
  /\/api\/push\//,
  /\/admin\/login/,
  /token/,
  /secret/,
  /otp/,
  /password/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching application shell...');
      return cache.addAll(APP_SHELL_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache partial failure:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => {
            console.log('[SW] Invalidate old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept GET requests from our origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Never cache sensitive endpoints
  const isSensitive = SENSITIVE_PATTERNS.some((pattern) => pattern.test(url.pathname));
  if (isSensitive) {
    return;
  }

  // Static Assets (Cache-First)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Dynamic Safe Client Project Data (Network-First with Dynamic Cache Fallback)
  if (url.pathname.startsWith('/api/projects') || url.pathname.startsWith('/api/user/projects')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(
              JSON.stringify({ error: 'You are offline', offline: true, projects: [] }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
              }
            );
          });
        })
    );
    return;
  }

  // Navigation Requests: Network-first with fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          return caches.match('/');
        });
      })
    );
  }
});

// -------------------------------------------------------------
// Push Notifications Handling
// -------------------------------------------------------------
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'Website Builders';
    const options = {
      body: payload.message || payload.body || 'You have a new update.',
      icon: payload.icon || '/images/logo.png',
      badge: '/images/logo.png',
      tag: payload.tag || 'wb-notification',
      data: {
        url: payload.url || payload.deepLink || '/user/dashboard',
      },
      vibrate: [100, 50, 100],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[SW] Push processing error:', err);
    event.waitUntil(
      self.registration.showNotification('Website Builders', {
        body: event.data.text(),
        icon: '/images/logo.png',
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/user/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
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
