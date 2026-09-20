import { NextResponse } from 'next/server';
import { getActiveRows } from '@/lib/sheets';
import { PortfolioItem } from '@/types/schema';

export async function GET() {
  try {
    const items = await getActiveRows<PortfolioItem>('Portfolio');
    // Sort by displayOrder ascending
    const sorted = [...items].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    return NextResponse.json({ portfolio: sorted });
  } catch (err) {
    console.error('GET /api/portfolio error:', err);
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}
