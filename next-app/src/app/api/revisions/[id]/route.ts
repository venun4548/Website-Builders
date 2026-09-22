import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { findRow, updateRow, now } from '@/lib/sheets';
import { RevisionRequest } from '@/types/schema';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { status, priority, assignedTo, internalRemarks, clientApproval } = body;

    const existing = await findRow<RevisionRequest>('RevisionRequests', (r) => r.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }

    const updates: Partial<RevisionRequest> = {
      updatedAt: now(),
    };

    if (user.role === 'client') {
      if (existing.clientId !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Clients can approve or mark resolved revisions
      if (status === 'Resolved' && existing.status === 'Awaiting Client') {
        updates.status = 'Resolved';
        updates.resolvedAt = now();
      }
    } else {
      // Admin / Staff controls
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (assignedTo !== undefined) updates.assignedTo = assignedTo;
      if (internalRemarks !== undefined) updates.internalRemarks = internalRemarks;
      if (status === 'Resolved' && !existing.resolvedAt) {
        updates.resolvedAt = now();
      }
    }

    const updated = await updateRow<RevisionRequest>('RevisionRequests', id, updates);

    return NextResponse.json({
      success: true,
      revision: {
        ...updated,
        internalRemarks: user.role === 'client' ? undefined : updated?.internalRemarks,
      },
    });
  } catch (err: any) {
    console.error('Error updating revision:', err);
    return NextResponse.json({ error: 'Failed to update revision' }, { status: 500 });
  }
}
