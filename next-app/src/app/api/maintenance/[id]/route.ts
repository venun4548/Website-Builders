import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { findRow, updateRow, now } from '@/lib/sheets';
import { MaintenanceRequest } from '@/types/schema';

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
    const {
      status,
      estimatedCost,
      approvedCost,
      clientApproval,
      assignedTo,
      assignedStaffName,
      remarks,
    } = body;

    const existing = await findRow<MaintenanceRequest>('MaintenanceRequests', (r) => r.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
    }

    const updates: Partial<MaintenanceRequest> = {
      updatedAt: now(),
    };

    if (user.role === 'client') {
      if (existing.clientId !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Client can approve or reject quote
      if (clientApproval) {
        updates.clientApproval = clientApproval;
        if (clientApproval === 'Approved') {
          updates.status = 'Approved';
          updates.approvedCost = existing.estimatedCost;
        } else if (clientApproval === 'Rejected') {
          updates.status = 'Cancelled';
        }
      }
    } else {
      // Admin / Staff
      if (status) updates.status = status;
      if (estimatedCost !== undefined) updates.estimatedCost = estimatedCost;
      if (approvedCost !== undefined) updates.approvedCost = approvedCost;
      if (clientApproval !== undefined) updates.clientApproval = clientApproval;
      if (assignedTo !== undefined) updates.assignedTo = assignedTo;
      if (assignedStaffName !== undefined) updates.assignedStaffName = assignedStaffName;
      if (remarks !== undefined) updates.remarks = remarks;

      if (status === 'Completed' && !existing.completedAt) {
        updates.completedAt = now();
      }
    }

    const updated = await updateRow<MaintenanceRequest>('MaintenanceRequests', id, updates);

    return NextResponse.json({ success: true, request: updated });
  } catch (err: any) {
    console.error('Error updating maintenance request:', err);
    return NextResponse.json({ error: 'Failed to update maintenance request' }, { status: 500 });
  }
}
