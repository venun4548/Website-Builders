import { getActiveRows, appendRow, generateId, now } from '@/lib/sheets';
import { sendEmail } from '@/lib/emailSender';
import { sendPushNotification } from '@/lib/push';
import { Project, DeadlineAlertLog, User } from '@/types/schema';

export async function processDeadlineAlerts(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
}> {
  const [projects, users, alertLogs] = await Promise.all([
    getActiveRows<Project>('Projects'),
    getActiveRows<User>('Users'),
    getActiveRows<DeadlineAlertLog>('DeadlineAlertLogs'),
  ]);

  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'superadmin');
  const adminEmail = adminUsers[0]?.email || 'websitebuildeers@gmail.com';

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const proj of projects) {
    processed++;
    if (!proj.estimatedLaunch || proj.stage === 'Launched') {
      skipped++;
      continue;
    }

    const launchDate = new Date(proj.estimatedLaunch);
    launchDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((launchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Specifically alert 7 days prior
    if (diffDays !== 7) {
      skipped++;
      continue;
    }

    const alreadySent = alertLogs.some(
      (log) =>
        log.projectId === proj.id &&
        log.alertType === '7_days_before' &&
        log.status === 'Sent'
    );

    if (alreadySent) {
      skipped++;
      continue;
    }

    const subject = `Deadline Alert: Project ${proj.name} is due in 7 days`;
    const message = `Project ${proj.id} (${proj.name}) is scheduled for launch on ${proj.estimatedLaunch}. Current progress: ${proj.progress}%, Stage: ${proj.stage}.`;

    const html = `
      <div style="font-family: sans-serif; color: #1e293b; max-width: 550px;">
        <h2 style="color: #e11d48;">Project Deadline Warning (7 Days Remaining)</h2>
        <p>Attention Team,</p>
        <p>${message}</p>
        <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <strong>Project ID:</strong> ${proj.id}<br>
          <strong>Project Name:</strong> ${proj.name}<br>
          <strong>Current Stage:</strong> ${proj.stage}<br>
          <strong>Current Progress:</strong> ${proj.progress}%<br>
          <strong>Launch Date:</strong> ${proj.estimatedLaunch}
        </div>
        <p><a href="https://website-builders-wine.vercel.app/admin/projects" style="display: inline-block; background: #e11d48; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Review Project Deliverables</a></p>
      </div>
    `;

    // Email Admin
    const emailSuccess = await sendEmail({
      to: adminEmail,
      recipientName: 'Admin Team',
      subject,
      html,
      type: 'deadline_alert',
      relatedId: proj.id,
    });

    // Send Web Push to Admin
    if (adminUsers[0]) {
      await sendPushNotification(adminUsers[0].id, {
        title: `Project Due in 7 Days: ${proj.name}`,
        message: `Project ${proj.id} launch is approaching on ${proj.estimatedLaunch}.`,
        url: `/admin/projects`,
        tag: `deadline-${proj.id}`,
      });
    }

    const statusVal = emailSuccess ? 'Sent' : 'Failed';
    if (emailSuccess) sent++;
    else failed++;

    await appendRow<DeadlineAlertLog>('DeadlineAlertLogs', {
      id: `DAL-${Date.now()}-${generateId().slice(0, 4)}`,
      projectId: proj.id,
      clientName: proj.clientName || '',
      clientEmail: proj.clientEmail || '',
      alertType: '7_days_before',
      scheduledDate: proj.estimatedLaunch,
      recipientId: adminUsers[0]?.id || 'admin',
      sentAt: now(),
      status: statusVal,
    });
  }

  return { processed, sent, skipped, failed };
}
