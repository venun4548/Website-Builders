import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, signJWT } from '@/lib/auth';
import { findRow } from '@/lib/sheets';
import { User } from '@/types/schema';
import {
  decryptSecret,
  verifyTotpToken,
  checkTotpRateLimit,
  recordTotpFailure,
  resetTotpAttempts,
} from '@/lib/totp';
import { SECURE_COOKIE_OPTIONS } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  try {
    const { tempToken, code } = await req.json();

    if (!tempToken || !code) {
      return NextResponse.json(
        { error: 'Temporary token and 6-digit authenticator code are required.' },
        { status: 400 }
      );
    }

    const payload = await verifyJWT(tempToken);
    if (!payload || payload.stage !== '2fa_required' || !payload.userId) {
      return NextResponse.json(
        { error: 'Session expired or invalid. Please sign in again.' },
        { status: 401 }
      );
    }

    // Check brute-force lockout
    const rateCheck = checkTotpRateLimit(payload.email);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Account locked for ${rateCheck.waitSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const user = await findRow<User>('Users', (u) => u.id === payload.userId);
    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ error: '2FA configuration not found for user.' }, { status: 400 });
    }

    const secret = decryptSecret(user.twoFactorSecret);
    if (!secret) {
      return NextResponse.json(
        { error: 'Failed to verify authenticator credentials.' },
        { status: 500 }
      );
    }

    const isValid = verifyTotpToken(code, secret);
    if (!isValid) {
      const failure = recordTotpFailure(payload.email);
      if (failure.locked) {
        return NextResponse.json(
          { error: 'Too many failed attempts. Account locked for 15 minutes.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Invalid authentication code. ${failure.remainingAttempts} attempts remaining.` },
        { status: 400 }
      );
    }

    // Success: reset attempts
    resetTotpAttempts(payload.email);

    // Issue permanent session token
    const token = await signJWT(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        onboardingComplete: user.onboardingComplete === 'true',
      },
      '24h'
    );

    const response = NextResponse.json({
      success: true,
      message: 'Two-factor authentication verified successfully.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        onboardingComplete: user.onboardingComplete === 'true',
      },
    });

    response.cookies.set('session', token, {
      ...SECURE_COOKIE_OPTIONS,
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('2FA verification error:', err);
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 });
  }
}
