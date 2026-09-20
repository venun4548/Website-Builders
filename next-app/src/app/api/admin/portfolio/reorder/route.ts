import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { updateRow } from '@/lib/sheets';
import { PortfolioItem } from '@/types/schema';

export const POST = withRole(['admin', 'superadmin'])(async (req) => {
  try {
    const body = await req.json();
    const { order } = body as { order: { id: string; displayOrder: number }[] };

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: 'Order array required' }, { status: 400 });
    }

    for (const item of order) {
      await updateRow<PortfolioItem>('Portfolio', item.id, { displayOrder: item.displayOrder });
    }

    return NextResponse.json({ success: true, message: 'Portfolio items reordered' });
  } catch (err) {
    console.error('POST /api/admin/portfolio/reorder error:', err);
    return NextResponse.json({ error: 'Failed to reorder portfolio' }, { status: 500 });
  }
});
