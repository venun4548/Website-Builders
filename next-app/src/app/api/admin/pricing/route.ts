import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { getActiveRows, appendRow, generateId, now } from '@/lib/sheets';
import { auditLog } from '@/lib/auditLog';
import { PricingTier } from '@/types/schema';

export const GET = withRole(['admin', 'superadmin', 'staff'])(async () => {
  try {
    const tiers = await getActiveRows<PricingTier>('Pricing');
    const parsed = tiers.map((tier) => {
      let features: string[] = [];
      try {
        features = typeof tier.features === 'string' ? JSON.parse(tier.features) : tier.features;
      } catch {
        features = [];
      }
      return {
        ...tier,
        features,
      };
    });

    const sorted = [...parsed].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    return NextResponse.json({ pricing: sorted });
  } catch (err) {
    console.error('GET /api/admin/pricing error:', err);
    return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 });
  }
});

export const POST = withRole(['admin', 'superadmin'])(async (req, { user }) => {
  try {
    const body = await req.json();
    const { tier, price, billing = 'one-time', description, features, highlighted } = body;

    if (!tier || !price || !description) {
      return NextResponse.json({ error: 'Missing required pricing fields' }, { status: 400 });
    }

    const tiers = await getActiveRows<PricingTier>('Pricing');
    const displayOrder = tiers.length + 1;

    const newTier: PricingTier = {
      id: generateId(),
      tier,
      price,
      billing,
      description,
      features: Array.isArray(features) ? JSON.stringify(features) : String(features || '[]'),
      highlighted: highlighted ? 'true' : 'false',
      displayOrder,
      createdAt: now(),
      updatedAt: now(),
    };

    await appendRow<PricingTier>('Pricing', newTier);

    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CREATE_PRICING_TIER',
      resourceType: 'pricing',
      resourceId: newTier.id,
      resourceName: newTier.tier,
      details: { price, billing },
      req,
    });

    return NextResponse.json({ success: true, tier: newTier }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/pricing error:', err);
    return NextResponse.json({ error: 'Failed to create pricing tier' }, { status: 500 });
  }
});
