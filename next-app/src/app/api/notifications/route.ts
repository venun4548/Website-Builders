import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { findRows, updateRow } from '@/lib/sheets';
import { Notification } from '@/types/schema';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await findRows<Notification>(
      'Notifications',
      (n) => n.userId === user.userId
    );

    // Sort newest first
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ notifications: sorted });
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      const userNotifications = await findRows<Notification>(
        'Notifications',
        (n) => n.userId === user.userId && n.read !== 'true'
      );
      for (const notif of userNotifications) {
        await updateRow<Notification>('Notifications', notif.id, { read: 'true' });
      }
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      await updateRow<Notification>('Notifications', notificationId, { read: 'true' });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing notificationId or markAllAsRead flag' }, { status: 400 });
  } catch (err) {
    console.error('PUT /api/notifications error:', err);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
