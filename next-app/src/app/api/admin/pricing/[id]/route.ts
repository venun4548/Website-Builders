import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRow, updateRow, deleteRow } from '@/lib/sheets';
import { auditLog } from '@/lib/auditLog';
import { PricingTier } from '@/types/schema';

export const PUT = withRole(['admin', 'superadmin'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();

    const existing = await findRow<PricingTier>('Pricing', (p) => p.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Pricing tier not found' }, { status: 404 });
    }

    const updates: Partial<PricingTier> = { ...body };
    if (Array.isArray(body.features)) {
      updates.features = JSON.stringify(body.features);
    }
    if (body.highlighted !== undefined) {
      updates.highlighted = body.highlighted ? 'true' : 'false';
    }

    const updated = await updateRow<PricingTier>('Pricing', id, updates);

    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UPDATE_PRICING_TIER',
      resourceType: 'pricing',
      resourceId: id,
      resourceName: existing.tier,
      details: body,
      req,
    });

    return NextResponse.json({ success: true, tier: updated });
  } catch (err) {
    console.error('PUT /api/admin/pricing/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update pricing tier' }, { status: 500 });
  }
});

export const DELETE = withRole(['admin', 'superadmin'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const existing = await findRow<PricingTier>('Pricing', (p) => p.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Pricing tier not found' }, { status: 404 });
    }

    await deleteRow('Pricing', id);

    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DELETE_PRICING_TIER',
      resourceType: 'pricing',
      resourceId: id,
      resourceName: existing.tier,
      details: {},
      req,
    });

    return NextResponse.json({ success: true, message: 'Pricing tier deleted' });
  } catch (err) {
    console.error('DELETE /api/admin/pricing/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete pricing tier' }, { status: 500 });
  }
});
