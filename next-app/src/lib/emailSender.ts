import nodemailer from 'nodemailer';
import { appendRow, generateId, now } from './sheets';
import { EmailLog, EmailLogType } from '@/types/schema';

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  encoding?: string;
}

export interface SendEmailOptions {
  to: string;
  recipientName?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  type?: EmailLogType;
  relatedId?: string;
}

export async function sendEmail({
  to,
  recipientName = '',
  subject,
  html,
  text,
  attachments = [],
  type = 'system',
  relatedId = '',
}: SendEmailOptions): Promise<boolean> {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const logId = `EL-${Date.now()}-${generateId().slice(0, 6)}`;
  const sentTime = now();

  // If no credentials or placeholder, log and return success simulation
  if (!user || !pass || pass.includes('mock')) {
    console.log(`[EMAIL DISPATCH - SIMULATED] To: ${to} | Subject: ${subject} | Type: ${type}`);
    try {
      await appendRow<EmailLog>('EmailLogs', {
        id: logId,
        recipient: to,
        recipientName,
        type,
        subject,
        relatedId,
        sentAt: sentTime,
        status: 'Sent',
        error: '',
        retryCount: 0,
      });
    } catch (logErr) {
      console.warn('Failed to log email to EmailLogs sheet:', logErr);
    }
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from: `"Website Builders" <${user}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      attachments,
    });

    console.log(`[EMAIL DISPATCH - SENT] To: ${to} | Subject: ${subject}`);

    try {
      await appendRow<EmailLog>('EmailLogs', {
        id: logId,
        recipient: to,
        recipientName,
        type,
        subject,
        relatedId,
        sentAt: sentTime,
        status: 'Sent',
        error: '',
        retryCount: 0,
      });
    } catch (logErr) {
      console.warn('Failed to log email to EmailLogs sheet:', logErr);
    }

    return true;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error(`[EMAIL DISPATCH - ERROR] Failed to send email to ${to}:`, errMsg);

    try {
      await appendRow<EmailLog>('EmailLogs', {
        id: logId,
        recipient: to,
        recipientName,
        type,
        subject,
        relatedId,
        sentAt: sentTime,
        status: 'Failed',
        error: errMsg,
        retryCount: 1,
      });
    } catch (logErr) {
      console.warn('Failed to log email error to EmailLogs sheet:', logErr);
    }

    return false;
  }
}

