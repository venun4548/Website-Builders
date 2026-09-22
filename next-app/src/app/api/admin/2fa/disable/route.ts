import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { findRow, updateRow, appendRow, generateId, now } from '@/lib/sheets';
import { User, AuditLogRecord } from '@/types/schema';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== 'admin' && session.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: 'Current password is required to disable 2FA.' }, { status: 400 });
    }

    const user = await findRow<User>('Users', (u) => u.id === session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 400 });
    }

    await updateRow<User>('Users', session.userId, {
      twoFactorEnabled: 'false',
      twoFactorSecret: '',
    });

    try {
      await appendRow<AuditLogRecord>('AuditLogs', {
        id: `AUD-${Date.now()}-${generateId().slice(0, 4)}`,
        actorId: session.userId,
        actorRole: session.role,
        action: '2FA_DISABLED',
        entityType: 'user',
        entityId: session.userId,
        description: `Admin ${session.email} disabled two-factor authentication`,
        ipHash: req.headers.get('x-forwarded-for')?.slice(0, 40) || 'unknown',
        userAgent: req.headers.get('user-agent')?.slice(0, 50) || 'unknown',
        createdAt: now(),
      });
    } catch (auditErr) {
      console.warn('Failed to append to AuditLogs:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Two-Factor Authentication disabled successfully.',
    });
  } catch (err: any) {
    console.error('Error disabling 2FA:', err);
    return NextResponse.json({ error: 'Failed to disable 2FA.' }, { status: 500 });
  }
}
