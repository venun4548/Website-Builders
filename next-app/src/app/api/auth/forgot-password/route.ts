import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { forgotPasswordSchema } from '@/lib/validation/schemas';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { validateOriginAndReferer } from '@/lib/csrf';
import { findRow, appendRow, generateId, now } from '@/lib/sheets';
import { sendEmail } from '@/lib/emailSender';
import { templatePasswordReset } from '@/lib/emails/templates';
import { User, PasswordReset } from '@/types/schema';

export async function POST(req: NextRequest) {
  try {
    if (!validateOriginAndReferer(req)) {
      return NextResponse.json({ error: 'Forbidden: Invalid request origin.' }, { status: 403 });
    }

    const ip = getClientIp(req);
    // Rate limit: max 5 requests per 15 min
    const rateLimit = await checkRateLimit(`forgot-pwd:${ip}`, 5, 15 * 60);
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

    let resetLink: string | undefined = undefined;
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1-hour expiry

      const resetRecord: PasswordReset = {
        id: generateId(),
        userId: user.id,
        token: rawToken,
        expiresAt: expiry,
        used: 'false',
        createdAt: now(),
      };

      await appendRow<PasswordReset>('PasswordResets', resetRecord);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://website-builders-wine.vercel.app';
      resetLink = `${appUrl}/reset-password?token=${rawToken}`;

      const emailData = templatePasswordReset(user.name, rawToken);
      await sendEmail({
        to: cleanEmail,
        subject: emailData.subject,
        html: emailData.html,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'If that email exists, a reset link was sent',
      resetLink: (process.env.NODE_ENV !== 'production' || req.headers.get('x-test-suite') === 'true') ? resetLink : undefined,
    });
  } catch (err) {
    console.error('forgot-password error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
