import { getActiveRows, appendRow, generateId, now } from '@/lib/sheets';
import { sendEmail } from '@/lib/emailSender';
import { Lead, LeadFollowUpLog, User } from '@/types/schema';

export async function processLeadFollowups(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
}> {
  const [leads, users, followUpLogs] = await Promise.all([
    getActiveRows<Lead>('Leads'),
    getActiveRows<User>('Users'),
    getActiveRows<LeadFollowUpLog>('LeadFollowUpLogs'),
  ]);

  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'superadmin');
  const adminEmail = adminUsers[0]?.email || 'websitebuildeers@gmail.com';

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const nowTime = Date.now();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

  for (const lead of leads) {
    processed++;
    // Skip if closed, won, or lost
    if (['Won', 'Lost', 'Closed', 'Converted'].includes(lead.status)) {
      skipped++;
      continue;
    }

    const lastActive = new Date(lead.updatedAt || lead.createdAt).getTime();
    if (nowTime - lastActive < twoDaysMs) {
      skipped++;
      continue;
    }

    // Idempotency check: Don't repeat if reminder was sent within the last 48 hours
    const recentReminder = followUpLogs.find(
      (log) =>
        log.leadId === lead.id &&
        nowTime - new Date(log.sentAt).getTime() < twoDaysMs &&
        log.status === 'Sent'
    );

    if (recentReminder) {
      skipped++;
      continue;
    }

    const subject = `Lead Follow-Up Reminder — ${lead.name} (${lead.id})`;
    const html = `
      <div style="font-family: sans-serif; color: #1e293b; max-width: 550px;">
        <h2 style="color: #0f172a;">Action Required: Follow Up with Lead</h2>
        <p>This lead has not had activity in over 48 hours and requires follow-up:</p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <strong>Lead ID:</strong> ${lead.id}<br>
          <strong>Name:</strong> ${lead.name}<br>
          <strong>Email:</strong> ${lead.email}<br>
          <strong>Phone:</strong> ${lead.phone || 'Not provided'}<br>
          <strong>Service Interest:</strong> ${lead.service || 'General Inquiry'}<br>
          <strong>Estimated Budget:</strong> ${lead.budget || 'Unspecified'}<br>
          <strong>Current Status:</strong> ${lead.status}<br>
          <strong>Initial Date:</strong> ${new Date(lead.createdAt).toLocaleDateString('en-IN')}
        </div>
        <p><a href="https://website-builders-wine.vercel.app/admin/leads" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Open Lead in Admin Portal</a></p>
      </div>
    `;

    const success = await sendEmail({
      to: lead.assignedTo || adminEmail,
      recipientName: 'Sales Team',
      subject,
      html,
      type: 'lead_followup',
      relatedId: lead.id,
    });

    const statusVal = success ? 'Sent' : 'Failed';
    if (success) sent++;
    else failed++;

    await appendRow<LeadFollowUpLog>('LeadFollowUpLogs', {
      id: `LFL-${Date.now()}-${generateId().slice(0, 4)}`,
      leadId: lead.id,
      recipient: lead.assignedTo || adminEmail,
      reminderDate: now().slice(0, 10),
      lastActivityAt: lead.updatedAt || lead.createdAt,
      sentAt: now(),
      status: statusVal,
    });
  }

  return { processed, sent, skipped, failed };
}
