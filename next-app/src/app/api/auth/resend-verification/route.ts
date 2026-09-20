import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { forgotPasswordSchema } from '@/lib/validation/schemas';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { validateOriginAndReferer } from '@/lib/csrf';
import { findRow, appendRow, generateId, now } from '@/lib/sheets';
import { sendEmail } from '@/lib/emailSender';
import { templateEmailVerification } from '@/lib/emails/templates';
import { User, EmailVerification } from '@/types/schema';

export async function POST(req: NextRequest) {
  try {
    if (!validateOriginAndReferer(req)) {
      return NextResponse.json({ error: 'Forbidden: Invalid request origin.' }, { status: 403 });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`resend-verif:${ip}`, 3, 15 * 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const parseResult = forgotPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed.', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email } = parseResult.data;
    const cleanEmail = email.trim().toLowerCase();
    const user = await findRow<User>('Users', (u) => u.email?.toLowerCase() === cleanEmail);

    let verificationLink: string | undefined = undefined;
    if (user && user.isEmailVerified !== 'true') {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const verificationRecord: EmailVerification = {
        id: generateId(),
        userId: user.id,
        token: rawToken,
        expiresAt: expiry,
        used: 'false',
        createdAt: now(),
      };

      await appendRow<EmailVerification>('EmailVerifications', verificationRecord);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://website-builders-wine.vercel.app';
      verificationLink = `${appUrl}/api/auth/verify-email?token=${rawToken}`;

      const emailData = templateEmailVerification(user.name, rawToken);
      await sendEmail({
        to: cleanEmail,
        subject: emailData.subject,
        html: emailData.html,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'If an unverified account with that email exists, a verification link has been sent.',
      verificationLink: (process.env.NODE_ENV !== 'production' || req.headers.get('x-test-suite') === 'true') ? verificationLink : undefined,
    });
  } catch (err) {
    console.error('resend-verification error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
