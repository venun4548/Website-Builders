import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRow, updateRow } from '@/lib/sheets';
import { auditLog } from '@/lib/auditLog';
import { Lead } from '@/types/schema';

export const PUT = withRole(['admin', 'superadmin'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();
    const { assignedTo } = body as { assignedTo: string };

    const lead = await findRow<Lead>('Leads', (l) => l.id === id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updated = await updateRow<Lead>('Leads', id, { assignedTo: assignedTo || '' });

    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'ASSIGN_LEAD',
      resourceType: 'lead',
      resourceId: id,
      resourceName: lead.name,
      details: { assignedTo },
      req,
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (err) {
    console.error('PUT /api/admin/leads/[id]/assign error:', err);
    return NextResponse.json({ error: 'Failed to assign lead' }, { status: 500 });
  }
});
