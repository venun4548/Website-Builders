import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { getActiveRows } from '@/lib/sheets';
import { Ticket, TicketMessage } from '@/types/schema';

export const GET = withRole(['admin', 'superadmin', 'staff'])(async (req, { user }) => {
  try {
    const tickets = await getActiveRows<Ticket>('Tickets');
    const messages = await getActiveRows<TicketMessage>('TicketMessages');

    const ticketsWithCount = tickets.map((tkt) => ({
      ...tkt,
      messageCount: messages.filter((m) => m.ticketId === tkt.id).length,
    }));

    return NextResponse.json({ tickets: ticketsWithCount });
  } catch (err) {
    console.error('GET /api/admin/tickets error:', err);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
});
