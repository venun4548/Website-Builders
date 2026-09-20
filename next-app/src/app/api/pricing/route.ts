import { NextResponse } from 'next/server';
import { getActiveRows } from '@/lib/sheets';
import { PricingTier } from '@/types/schema';

export async function GET() {
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
    console.error('GET /api/pricing error:', err);
    return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 });
  }
}
