import { getActiveRows, updateRow, now } from '@/lib/sheets';
import { sendEmail } from '@/lib/emailSender';
import { AbandonedContact, ContactSubmission, Lead } from '@/types/schema';

export async function processAbandonedFollowups(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
}> {
  const [abandonedList, submissions, leads] = await Promise.all([
    getActiveRows<AbandonedContact>('AbandonedContacts'),
    getActiveRows<ContactSubmission>('ContactSubmissions'),
    getActiveRows<Lead>('Leads'),
  ]);

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const nowTime = Date.now();
  const delay24h = 24 * 60 * 60 * 1000;

  for (const item of abandonedList) {
    processed++;
    if (String(item.followUpSent).toLowerCase() === 'true' || item.status === 'opted_out') {
      skipped++;
      continue;
    }

    const started = new Date(item.startedAt).getTime();
    if (nowTime - started < delay24h) {
      skipped++;
      continue;
    }

    // Check if user subsequently submitted via Contact form or became Lead
    const emailLower = item.email.toLowerCase().trim();
    const alreadySubmitted =
      submissions.some((s) => s.email.toLowerCase().trim() === emailLower) ||
      leads.some((l) => l.email.toLowerCase().trim() === emailLower);

    if (alreadySubmitted) {
      await updateRow<AbandonedContact>('AbandonedContacts', item.id, {
        status: 'converted',
      });
      skipped++;
      continue;
    }

    const recipientName = item.name || 'there';
    const subject = 'You started contacting Website Builders';
    const html = `
      <div style="font-family: sans-serif; color: #1e293b; max-width: 550px;">
        <h2 style="color: #0f172a;">Can we help complete your web inquiry?</h2>
        <p>Hello ${recipientName},</p>
        <p>We noticed you recently started getting in touch with Website Builders regarding your digital project, but didn't finish submitting your request.</p>
        <p>If you still need assistance or have questions about our web development, pricing, or custom software solutions, our engineering team is here to help:</p>
        <p><a href="https://website-builders-wine.vercel.app/contact" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-weight: bold;">Continue Your Inquiry</a></p>
        <p style="font-size: 13px; color: #64748b;">If you no longer need assistance, no further action is required. We respect your inbox and will not send repeated reminders.</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">Website Builders Co. • websitebuildeers@gmail.com</p>
      </div>
    `;

    const success = await sendEmail({
      to: item.email,
      recipientName: item.name,
      subject,
      html,
      type: 'lead_followup',
      relatedId: item.id,
    });

    if (success) {
      sent++;
      await updateRow<AbandonedContact>('AbandonedContacts', item.id, {
        followUpSent: 'true',
        followUpSentAt: now(),
        status: 'followed_up',
      });
    } else {
      failed++;
    }
  }

  return { processed, sent, skipped, failed };
}
