import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRow, updateRow, deleteRow } from '@/lib/sheets';
import { auditLog } from '@/lib/auditLog';
import { PortfolioItem } from '@/types/schema';

export const PUT = withRole(['admin', 'superadmin'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();

    const existing = await findRow<PortfolioItem>('Portfolio', (p) => p.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 });
    }

    const updated = await updateRow<PortfolioItem>('Portfolio', id, body);

    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UPDATE_PORTFOLIO_ITEM',
      resourceType: 'portfolio',
      resourceId: id,
      resourceName: existing.title,
      details: body,
      req,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err) {
    console.error('PUT /api/admin/portfolio/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update portfolio item' }, { status: 500 });
  }
});

export const DELETE = withRole(['admin', 'superadmin'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const existing = await findRow<PortfolioItem>('Portfolio', (p) => p.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 });
    }

    await deleteRow('Portfolio', id);

    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DELETE_PORTFOLIO_ITEM',
      resourceType: 'portfolio',
      resourceId: id,
      resourceName: existing.title,
      details: {},
      req,
    });

    return NextResponse.json({ success: true, message: 'Portfolio item deleted' });
  } catch (err) {
    console.error('DELETE /api/admin/portfolio/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete portfolio item' }, { status: 500 });
  }
});
