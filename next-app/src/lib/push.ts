import webpush from 'web-push';
import { getActiveRows, appendRow, updateRow, generateId, now } from './sheets';
import { PushSubscriptionRecord } from '@/types/schema';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const subject = process.env.VAPID_SUBJECT || 'mailto:websitebuilders@gmail.com';

if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  } catch (err) {
    console.warn('[PUSH] Failed to set VAPID details:', err);
  }
}

export interface PushNotificationPayload {
  title: string;
  message: string;
  url?: string;
  tag?: string;
  relatedEntity?: string;
}

/**
 * Send push notification to all active devices registered to a user
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  if (!publicKey || !privateKey) {
    console.log('[PUSH SIMULATED - NO VAPID] User:', userId, 'Title:', payload.title);
    return { sent: 0, failed: 0 };
  }

  try {
    const allSubs = await getActiveRows<PushSubscriptionRecord>('PushSubscriptions');
    const userSubs = allSubs.filter(
      (s) => s.userId === userId && String(s.active).toLowerCase() === 'true'
    );

    if (userSubs.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    const bodyString = JSON.stringify({
      title: payload.title,
      message: payload.message,
      body: payload.message,
      url: payload.url || '/user/dashboard',
      tag: payload.tag || 'wb-alert',
      timestamp: Date.now(),
    });

    for (const sub of userSubs) {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushConfig, bodyString);
        sent++;
        await updateRow<PushSubscriptionRecord>('PushSubscriptions', sub.id, {
          lastUsedAt: now(),
        });
      } catch (err: any) {
        failed++;
        console.warn(`[PUSH] Failed to send to endpoint ${sub.endpoint}:`, err?.statusCode || err);
        // If expired or gone (404/410), deactivate subscription
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await updateRow<PushSubscriptionRecord>('PushSubscriptions', sub.id, {
            active: 'false',
          });
        }
      }
    }

    return { sent, failed };
  } catch (err) {
    console.error('[PUSH ERROR] Error dispatching push notification:', err);
    return { sent: 0, failed: 1 };
  }
}

/**
 * Register or update a user's web push subscription
 */
export async function registerPushSubscription({
  userId,
  role,
  email,
  endpoint,
  p256dh,
  auth,
  device = '',
  browser = '',
}: {
  userId: string;
  role: string;
  email: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device?: string;
  browser?: string;
}): Promise<PushSubscriptionRecord> {
  const existing = await getActiveRows<PushSubscriptionRecord>('PushSubscriptions');
  const found = existing.find((s) => s.endpoint === endpoint);

  if (found) {
    const updated = await updateRow<PushSubscriptionRecord>('PushSubscriptions', found.id, {
      userId,
      role,
      email,
      p256dh,
      auth,
      device,
      browser,
      active: 'true',
      lastUsedAt: now(),
    });
    return updated || found;
  }

  const newSub = await appendRow<PushSubscriptionRecord>('PushSubscriptions', {
    id: `PS-${Date.now()}-${generateId().slice(0, 4)}`,
    userId,
    role,
    email,
    endpoint,
    p256dh,
    auth,
    device,
    browser,
    createdAt: now(),
    lastUsedAt: now(),
    active: 'true',
  });

  return newSub;
}

/**
 * Deactivate a push subscription
 */
export async function unregisterPushSubscription(endpoint: string): Promise<boolean> {
  const existing = await getActiveRows<PushSubscriptionRecord>('PushSubscriptions');
  const found = existing.find((s) => s.endpoint === endpoint);
  if (!found) return false;

  await updateRow<PushSubscriptionRecord>('PushSubscriptions', found.id, {
    active: 'false',
  });
  return true;
}
