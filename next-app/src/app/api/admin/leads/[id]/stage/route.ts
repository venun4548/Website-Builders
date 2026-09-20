import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRow, updateRow } from '@/lib/sheets';
import { auditLog } from '@/lib/auditLog';
import { Lead, LeadStatus } from '@/types/schema';

export const PUT = withRole(['admin', 'superadmin', 'staff'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();
    const { status } = body as { status: LeadStatus };

    const validStatuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid lead status' }, { status: 400 });
    }

    const lead = await findRow<Lead>('Leads', (l) => l.id === id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updated = await updateRow<Lead>('Leads', id, { status });

    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UPDATE_LEAD_STAGE',
      resourceType: 'lead',
      resourceId: id,
      resourceName: lead.name,
      details: { from: lead.status, to: status },
      req,
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (err) {
    console.error('PUT /api/admin/leads/[id]/stage error:', err);
    return NextResponse.json({ error: 'Failed to update lead status' }, { status: 500 });
  }
});
