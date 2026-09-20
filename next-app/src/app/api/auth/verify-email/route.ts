import { NextRequest, NextResponse } from 'next/server';
import { findRow, updateRow } from '@/lib/sheets';
import { EmailVerification, User } from '@/types/schema';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/user/login?error=InvalidVerificationToken', req.url));
    }

    const verification = await findRow<EmailVerification>(
      'EmailVerifications',
      (v) => v.token === token && v.used !== 'true'
    );

    if (!verification) {
      return NextResponse.redirect(new URL('/user/login?error=InvalidVerificationToken', req.url));
    }

    const isExpired = new Date(verification.expiresAt).getTime() < Date.now();
    if (isExpired) {
      return NextResponse.redirect(new URL('/user/login?error=VerificationTokenExpired', req.url));
    }

    // Mark verification used
    await updateRow<EmailVerification>('EmailVerifications', verification.id, { used: 'true' });

    // Mark user as verified in Users tab
    await updateRow<User>('Users', verification.userId, { isEmailVerified: 'true' });

    return NextResponse.redirect(new URL('/user/login?verified=true', req.url));
  } catch (err) {
    console.error('Email verification error:', err);
    return NextResponse.redirect(new URL('/user/login?error=VerificationFailed', req.url));
  }
}
