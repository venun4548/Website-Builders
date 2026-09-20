import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { findRow, updateRow, appendRow, generateId, now } from '@/lib/sheets';
import { BrandInfo } from '@/types/schema';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      brandName,
      tagline,
      primaryColor,
      secondaryColor,
      fontFamily,
      targetAudience,
      competitors,
      brandValues,
      existingWebsite,
      assetsUrl,
    } = body;

    const existing = await findRow<BrandInfo>('BrandInfo', (b) => b.userId === session.userId);

    let result: BrandInfo;

    if (existing) {
      result = (await updateRow<BrandInfo>('BrandInfo', existing.id, {
        brandName,
        tagline,
        primaryColor,
        secondaryColor,
        fontFamily,
        targetAudience,
        competitors,
        brandValues,
        existingWebsite,
        assetsUrl,
        updatedAt: now(),
      })) as BrandInfo;
    } else {
      result = await appendRow<BrandInfo>('BrandInfo', {
        id: generateId(),
        userId: session.userId,
        brandName: brandName || '',
        tagline: tagline || '',
        primaryColor: primaryColor || '#3b82f6',
        secondaryColor: secondaryColor || '#1e293b',
        fontFamily: fontFamily || 'Inter',
        targetAudience: targetAudience || '',
        competitors: competitors || '',
        brandValues: brandValues || '',
        existingWebsite: existingWebsite || '',
        assetsUrl: assetsUrl || '',
        updatedAt: now(),
      });
    }

    return NextResponse.json({ success: true, brandInfo: result });
  } catch (err) {
    console.error('POST /api/user/brand-info error:', err);
    return NextResponse.json({ error: 'Failed to save brand info' }, { status: 500 });
  }
}
