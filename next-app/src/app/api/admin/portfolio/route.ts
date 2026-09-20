import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { getActiveRows, appendRow, generateId, now } from '@/lib/sheets';
import { auditLog } from '@/lib/auditLog';
import { PortfolioItem } from '@/types/schema';

export const GET = withRole(['admin', 'superadmin', 'staff'])(async () => {
  try {
    const items = await getActiveRows<PortfolioItem>('Portfolio');
    const sorted = [...items].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    return NextResponse.json({ portfolio: sorted });
  } catch (err) {
    console.error('GET /api/admin/portfolio error:', err);
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
});

export const POST = withRole(['admin', 'superadmin'])(async (req, { user }) => {
  try {
    const body = await req.json();
    const { title, category, description, imageUrl, liveUrl, clientName, featured } = body;

    if (!title || !category || !description || !imageUrl) {
      return NextResponse.json({ error: 'Missing required portfolio fields' }, { status: 400 });
    }

    const items = await getActiveRows<PortfolioItem>('Portfolio');
    const displayOrder = items.length + 1;

    const newItem: PortfolioItem = {
      id: generateId(),
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      liveUrl: liveUrl?.trim() || '',
      clientName: clientName?.trim() || '',
      displayOrder,
      featured: featured ? 'true' : 'false',
      createdAt: now(),
      updatedAt: now(),
    };

    await appendRow<PortfolioItem>('Portfolio', newItem);

    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CREATE_PORTFOLIO_ITEM',
      resourceType: 'portfolio',
      resourceId: newItem.id,
      resourceName: newItem.title,
      details: { category },
      req,
    });

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/portfolio error:', err);
    return NextResponse.json({ error: 'Failed to create portfolio item' }, { status: 500 });
  }
});
