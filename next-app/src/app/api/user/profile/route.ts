import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { findRow, updateRow } from '@/lib/sheets';
import { User, BrandInfo } from '@/types/schema';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await findRow<User>('Users', (u) => u.id === session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const brandInfo = await findRow<BrandInfo>('BrandInfo', (b) => b.userId === session.userId);

    // Strip passwordHash
    const { passwordHash, ...safeUser } = user;

    return NextResponse.json({ user: safeUser, brandInfo });
  } catch (err) {
    console.error('GET /api/user/profile error:', err);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, company, brandName, brandTagline, primaryColor, fontPreference, targetAudience } = body;

    const updated = await updateRow<User>('Users', session.userId, {
      ...(name ? { name } : {}),
      ...(company ? { company } : {}),
      ...(brandName ? { brandName } : {}),
      ...(brandTagline ? { brandTagline } : {}),
      ...(primaryColor ? { primaryColor } : {}),
      ...(fontPreference ? { fontPreference } : {}),
      ...(targetAudience ? { targetAudience } : {}),
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error('PUT /api/user/profile error:', err);
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
  }
}
