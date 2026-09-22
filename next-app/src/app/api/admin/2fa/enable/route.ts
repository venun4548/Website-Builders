import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { verifyTotpToken, encryptSecret } from '@/lib/totp';
import { updateRow, appendRow, generateId, now } from '@/lib/sheets';
import { User, AuditLogRecord } from '@/types/schema';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== 'admin' && session.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { code, secret } = await req.json();

    if (!code || !secret) {
      return NextResponse.json({ error: 'Verification code and secret are required.' }, { status: 400 });
    }

    const isValid = verifyTotpToken(code, secret);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid authentication code.' }, { status: 400 });
    }

    // Encrypt secret before storage
    const encryptedSecret = encryptSecret(secret);

    // Update user record
    await updateRow<User>('Users', session.userId, {
      twoFactorEnabled: 'true',
      twoFactorSecret: encryptedSecret,
    });

    // Record in AuditLogs
    try {
      await appendRow<AuditLogRecord>('AuditLogs', {
        id: `AUD-${Date.now()}-${generateId().slice(0, 4)}`,
        actorId: session.userId,
        actorRole: session.role,
        action: '2FA_ENABLED',
        entityType: 'user',
        entityId: session.userId,
        description: `Admin ${session.email} enabled two-factor authentication`,
        ipHash: req.headers.get('x-forwarded-for')?.slice(0, 40) || 'unknown',
        userAgent: req.headers.get('user-agent')?.slice(0, 50) || 'unknown',
        createdAt: now(),
      });
    } catch (auditErr) {
      console.warn('Failed to append to AuditLogs:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Two-Factor Authentication enabled successfully.',
    });
  } catch (err: any) {
    console.error('Error enabling 2FA:', err);
    return NextResponse.json({ error: 'Failed to enable 2FA.' }, { status: 500 });
  }
}
