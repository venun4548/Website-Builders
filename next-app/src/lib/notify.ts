import { appendRow, generateId, now } from './sheets';
import { triggerPusher } from './pusher';
import { Notification, NotificationType } from '@/types/schema';

export async function sendNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<Notification> {
  const notification: Notification = {
    id: generateId(),
    userId,
    type,
    title,
    message,
    link: link || '',
    read: 'false',
    createdAt: now(),
  };

  try {
    await appendRow<Notification>('Notifications', notification);
    await triggerPusher(`user-${userId}`, 'notification', notification);
  } catch (err) {
    console.error('Failed to send notification:', err);
  }

  return notification;
}
