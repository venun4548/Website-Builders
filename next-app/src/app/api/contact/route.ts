import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validation/schemas';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { validateOriginAndReferer } from '@/lib/csrf';
import { appendRow, generateId, now } from '@/lib/sheets';
import { sendEmail } from '@/lib/emailSender';
import { templateContactAcknowledgment, templateLeadAdminAlert } from '@/lib/emails/templates';
import { ContactSubmission, Lead } from '@/types/schema';

export async function POST(req: NextRequest) {
  try {
    if (!validateOriginAndReferer(req)) {
      return NextResponse.json({ error: 'Forbidden: Invalid request origin.' }, { status: 403 });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`contact:${ip}`, 5, 10 * 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const parseResult = contactFormSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed.', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, phone, service, message, honeypot, turnstileToken } = parseResult.data;
    const budget = (body as any).budget || 'Not specified';

    // Honeypot field check
    if (honeypot && honeypot.length > 0) {
      return NextResponse.json({ error: 'Submission rejected.' }, { status: 400 });
    }

    // Turnstile check
    const isBotCheckPassed = await verifyTurnstileToken(turnstileToken, ip);
    if (!isBotCheckPassed) {
      return NextResponse.json({ error: 'Bot verification failed. Please try again.' }, { status: 400 });
    }

    const submissionId = generateId();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Record in ContactSubmissions sheet
    const submission: ContactSubmission = {
      id: submissionId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone || '',
      service: service || 'General',
      message: message.trim(),
      submittedAt: now(),
      convertedToLead: 'true',
    };
    await appendRow<ContactSubmission>('ContactSubmissions', submission);

    // 2. Automatically create CRM Lead entry in Leads sheet
    const leadId = generateId();
    const lead: Lead = {
      id: leadId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone || '',
      service: service || 'General',
      budget,
      message: message.trim(),
      status: 'New',
      assignedTo: '',
      convertedProjectId: '',
      createdAt: now(),
      updatedAt: now(),
    };
    await appendRow<Lead>('Leads', lead);

    // 3. Send acknowledgment email to inquirer
    const clientEmailData = templateContactAcknowledgment(name.trim());
    await sendEmail({
      to: cleanEmail,
      subject: clientEmailData.subject,
      html: clientEmailData.html,
    });

    // 4. Send alert to admin team
    const adminEmailData = templateLeadAdminAlert({
      name: name.trim(),
      email: cleanEmail,
      phone: phone || '',
      service: service || 'General',
      budget,
      message: message.trim(),
    });
    await sendEmail({
      to: 'websitebuilders@gmail.com',
      subject: adminEmailData.subject,
      html: adminEmailData.html,
    });

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully.',
      submissionId,
    });
  } catch (err) {
    console.error('Contact submission error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
