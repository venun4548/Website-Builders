import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { generateTotpSetup } from '@/lib/totp';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const setup = await generateTotpSetup(user.email);

    return NextResponse.json({
      success: true,
      manualKey: setup.manualKey,
      qrCodeUrl: setup.qrCodeUrl,
      // Pass secret securely to enable endpoint in this setup session
      setupSecret: setup.secret,
    });
  } catch (err: any) {
    console.error('Error generating 2FA setup:', err);
    return NextResponse.json({ error: 'Failed to initiate 2FA setup.' }, { status: 500 });
  }
}
