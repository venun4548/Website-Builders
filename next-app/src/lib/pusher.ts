import Pusher from 'pusher';

let pusherInstance: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (pusherInstance) return pusherInstance;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || 'ap2';

  if (!appId || !key || !secret || appId.includes('mock') || secret.includes('mock')) {
    return null;
  }

  try {
    pusherInstance = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
    return pusherInstance;
  } catch (err) {
    console.warn('Failed to initialize Pusher server:', err);
    return null;
  }
}

export async function triggerPusher(channel: string, event: string, data: any) {
  const pusher = getPusherServer();
  if (!pusher) {
    // Graceful fallback in development/test
    return;
  }
  try {
    await pusher.trigger(channel, event, data);
  } catch (err) {
    console.warn(`Pusher trigger error [${channel}/${event}]:`, err);
  }
}
