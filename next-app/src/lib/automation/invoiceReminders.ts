import { getActiveRows, findRows, appendRow, generateId, now } from '@/lib/sheets';
import { sendEmail } from '@/lib/emailSender';
import { Invoice, InvoiceReminderLog, User } from '@/types/schema';

export async function processInvoiceReminders(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
}> {
  const [invoices, users, reminderLogs] = await Promise.all([
    getActiveRows<Invoice>('Invoices'),
    getActiveRows<User>('Users'),
    getActiveRows<InvoiceReminderLog>('InvoiceReminderLogs'),
  ]);

  const unpaidInvoices = invoices.filter(
    (inv) => !['paid', 'cancelled'].includes(String(inv.status).toLowerCase()) && inv.dueDate
  );

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const inv of unpaidInvoices) {
    processed++;
    const dueDate = new Date(inv.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let reminderType: 'before_due' | 'due_today' | 'overdue' | null = null;
    if (diffDays === 3) {
      reminderType = 'before_due';
    } else if (diffDays === 0) {
      reminderType = 'due_today';
    } else if (diffDays === -3) {
      reminderType = 'overdue';
    }

    if (!reminderType) {
      skipped++;
      continue;
    }

    // Idempotency: Check if this invoice has already received this exact reminder
    const alreadySent = reminderLogs.some(
      (log) => log.invoiceId === inv.id && log.type === reminderType && log.status === 'Sent'
    );

    if (alreadySent) {
      skipped++;
      continue;
    }

    const clientEmail = inv.clientEmail;
    if (!clientEmail) {
      skipped++;
      continue;
    }

    const clientName = inv.clientName || 'Valued Client';
    const amount = Number(inv.totalAmount) || Number(inv.amount) || 0;

    let subject = '';
    let headline = '';
    if (reminderType === 'before_due') {
      subject = `Your invoice is due in 3 days — ${inv.id}`;
      headline = `Your invoice ${inv.id} for ₹${amount.toLocaleString('en-IN')} is due on ${inv.dueDate}.`;
    } else if (reminderType === 'due_today') {
      subject = `Your invoice is due today — ${inv.id}`;
      headline = `Your invoice ${inv.id} for ₹${amount.toLocaleString('en-IN')} is due today.`;
    } else {
      subject = `Your invoice is overdue — ${inv.id}`;
      headline = `Your invoice ${inv.id} for ₹${amount.toLocaleString('en-IN')} is overdue. Please remit payment promptly.`;
    }

    const html = `
      <div style="font-family: sans-serif; color: #1e293b; max-width: 550px;">
        <h2 style="color: #0f172a;">${subject}</h2>
        <p>Dear ${clientName},</p>
        <p>${headline}</p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <strong>Invoice ID:</strong> ${inv.id}<br>
          <strong>Project:</strong> ${inv.projectName}<br>
          <strong>Total Due:</strong> ₹${amount.toLocaleString('en-IN')}<br>
          <strong>Due Date:</strong> ${inv.dueDate}
        </div>
        <p>You can review and pay your invoice securely online through your client portal:</p>
        <p><a href="https://website-builders-wine.vercel.app/user/invoices" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">View & Pay Invoice</a></p>
        <p style="font-size: 12px; color: #64748b; margin-top: 30px;">Website Builders Accounting • websitebuildeers@gmail.com</p>
      </div>
    `;

    const success = await sendEmail({
      to: clientEmail,
      recipientName: clientName,
      subject,
      html,
      type: 'invoice_reminder',
      relatedId: inv.id,
    });

    const statusVal = success ? 'Sent' : 'Failed';
    if (success) sent++;
    else failed++;

    await appendRow<InvoiceReminderLog>('InvoiceReminderLogs', {
      id: `IRL-${Date.now()}-${generateId().slice(0, 4)}`,
      invoiceId: inv.id,
      clientId: inv.clientId,
      clientName: inv.clientName || clientName,
      clientEmail: clientEmail,
      type: reminderType,
      scheduledDate: inv.dueDate,
      sentAt: now(),
      status: statusVal,
    });
  }

  return { processed, sent, skipped, failed };
}
