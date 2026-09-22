import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { registerPushSubscription } from '@/lib/push';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, keys, device, browser } = body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: 'Invalid push subscription payload' },
        { status: 400 }
      );
    }

    const sub = await registerPushSubscription({
      userId: user.userId,
      role: user.role,
      email: user.email,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      device: device || req.headers.get('user-agent')?.slice(0, 50) || 'Unknown Device',
      browser: browser || 'Browser',
    });

    return NextResponse.json({ success: true, subscriptionId: sub.id });
  } catch (err: any) {
    console.error('Error subscribing to push notifications:', err);
    return NextResponse.json(
      { error: 'Failed to save push subscription' },
      { status: 500 }
    );
  }
}
