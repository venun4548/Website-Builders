import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRow, findRows } from '@/lib/sheets';
import { Ticket, TicketMessage } from '@/types/schema';

export const GET = withRole(['client', 'admin', 'superadmin', 'staff'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const ticket = await findRow<Ticket>('Tickets', (t) => t.id === id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (
      user.role === 'client' &&
      ticket.clientId !== user.userId &&
      ticket.clientEmail?.toLowerCase() !== user.email.toLowerCase()
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await findRows<TicketMessage>('TicketMessages', (m) => m.ticketId === id);

    return NextResponse.json({ ticket, messages });
  } catch (err) {
    console.error('GET /api/user/tickets/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
  }
});
