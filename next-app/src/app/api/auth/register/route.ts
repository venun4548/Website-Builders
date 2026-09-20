import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { registrationSchema } from '@/lib/validation/schemas';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstileToken } from '@/lib/turnstile';
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
    // Rate limit: max 3 per IP per hour
    const rateLimit = await checkRateLimit(`register:${ip}`, 3, 60 * 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Registration rate limit exceeded. Please try again in an hour.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
          },
        }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const parseResult = registrationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed.', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fullName, email, password, honeypot, turnstileToken } = parseResult.data;

    // Honeypot check
    if (honeypot && honeypot.length > 0) {
      return NextResponse.json({ error: 'Submission rejected.' }, { status: 400 });
    }

    // Turnstile bot protection
    const isBotCheckPassed = await verifyTurnstileToken(turnstileToken, ip);
    if (!isBotCheckPassed) {
      return NextResponse.json({ error: 'Bot verification failed. Please refresh and try again.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already registered in Google Sheets Users tab
    const existing = await findRow<User>('Users', (u) => u.email?.toLowerCase() === cleanEmail);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 409 });
    }

    // Hash password with bcrypt (12 rounds)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = generateId();
    const newUser: User = {
      id: userId,
      email: cleanEmail,
      passwordHash,
      name: fullName.trim(),
      role: 'client',
      isEmailVerified: 'false',
      onboardingComplete: 'false',
      createdAt: now(),
      updatedAt: now(),
    };

    await appendRow<User>('Users', newUser);

    // Generate 32-byte verification token (24-hour expiry)
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const verificationRecord: EmailVerification = {
      id: generateId(),
      userId,
      token: rawVerificationToken,
      expiresAt: tokenExpiry,
      used: 'false',
      createdAt: now(),
    };

    await appendRow<EmailVerification>('EmailVerifications', verificationRecord);

    // Dispatch verification email
    const emailData = templateEmailVerification(fullName, rawVerificationToken);
    await sendEmail({
      to: cleanEmail,
      subject: emailData.subject,
      html: emailData.html,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://website-builders-wine.vercel.app';
    const verificationLink = `${appUrl}/api/auth/verify-email?token=${rawVerificationToken}`;

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      verificationLink: (process.env.NODE_ENV !== 'production' || req.headers.get('x-test-suite') === 'true') ? verificationLink : undefined,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
