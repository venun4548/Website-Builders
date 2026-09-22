import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { unregisterPushSubscription } from '@/lib/push';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    const success = await unregisterPushSubscription(endpoint);
    return NextResponse.json({ success });
  } catch (err: any) {
    console.error('Error unsubscribing from push notifications:', err);
    return NextResponse.json(
      { error: 'Failed to deactivate push subscription' },
      { status: 500 }
    );
  }
}
