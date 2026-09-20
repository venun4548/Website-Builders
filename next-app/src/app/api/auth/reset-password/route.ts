import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { resetPasswordSchema } from '@/lib/validation/schemas';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { validateOriginAndReferer } from '@/lib/csrf';
import { findRow, updateRow } from '@/lib/sheets';
import { PasswordReset, User } from '@/types/schema';

export async function POST(req: NextRequest) {
  try {
    if (!validateOriginAndReferer(req)) {
      return NextResponse.json({ error: 'Forbidden: Invalid request origin.' }, { status: 403 });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`reset-pwd:${ip}`, 5, 15 * 60);
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

    const parseResult = resetPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed.', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, password } = parseResult.data;

    const resetRecord = await findRow<PasswordReset>(
      'PasswordResets',
      (r) => r.token === token && r.used !== 'true'
    );

    if (!resetRecord) {
      return NextResponse.json({ error: 'Invalid or expired password reset token.' }, { status: 400 });
    }

    const isExpired = new Date(resetRecord.expiresAt).getTime() < Date.now();
    if (isExpired) {
      return NextResponse.json({ error: 'Password reset token has expired.' }, { status: 400 });
    }

    // Hash new password with bcrypt (12 rounds)
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(password, salt);

    // Update user's password in Users sheet
    await updateRow<User>('Users', resetRecord.userId, { passwordHash: newPasswordHash });

    // Mark reset token used
    await updateRow<PasswordReset>('PasswordResets', resetRecord.id, { used: 'true' });

    const response = NextResponse.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
    });

    response.cookies.delete('session');
    return response;
  } catch (err) {
    console.error('reset-password error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
