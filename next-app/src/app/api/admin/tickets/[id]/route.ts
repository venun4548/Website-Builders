import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRow, updateRow, findRows } from '@/lib/sheets';
import { auditLog } from '@/lib/auditLog';
import { Ticket, TicketMessage } from '@/types/schema';

export const GET = withRole(['admin', 'superadmin', 'staff'])(async (req, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const ticket = await findRow<Ticket>('Tickets', (t) => t.id === id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const messages = await findRows<TicketMessage>('TicketMessages', (m) => m.ticketId === id);
    return NextResponse.json({ ticket, messages });
  } catch (err) {
    console.error('GET /api/admin/tickets/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
  }
});

export const PUT = withRole(['admin', 'superadmin', 'staff'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();

    const existing = await findRow<Ticket>('Tickets', (t) => t.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const updated = await updateRow<Ticket>('Tickets', id, body);

    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UPDATE_TICKET',
      resourceType: 'ticket',
      resourceId: id,
      resourceName: existing.subject,
      details: body,
      req,
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (err) {
    console.error('PUT /api/admin/tickets/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
});
