import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRow, updateRow, appendRow, generateId, now } from '@/lib/sheets';
import { triggerPusher } from '@/lib/pusher';
import { sendEmail } from '@/lib/emailSender';
import { templateTicketReply } from '@/lib/emails/templates';
import { Ticket, TicketMessage } from '@/types/schema';

export const POST = withRole(['client', 'admin', 'superadmin', 'staff'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const ticketId = resolvedParams.id;
    const body = await req.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const ticket = await findRow<Ticket>('Tickets', (t) => t.id === ticketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const newMsg: TicketMessage = {
      id: generateId(),
      ticketId,
      senderEmail: user.email,
      senderRole: user.role,
      message: message.trim(),
      timestamp: now(),
    };

    await appendRow<TicketMessage>('TicketMessages', newMsg);
    await updateRow<Ticket>('Tickets', ticketId, { updatedAt: now() });

    // Realtime Pusher broadcast
    await triggerPusher(`ticket-${ticketId}`, 'new-message', newMsg);

    // Email notifications
    if (user.role === 'client') {
      // Notify staff/admin
      if (ticket.assignedTo) {
        const emailContent = templateTicketReply('Support Team', ticketId, user.name || user.email, message.trim());
        await sendEmail({
          to: ticket.assignedTo,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }
    } else {
      // Staff/admin replied, notify client
      if (ticket.clientEmail) {
        const emailContent = templateTicketReply(ticket.clientName, ticketId, 'Website Builders Support', message.trim());
        await sendEmail({
          to: ticket.clientEmail,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }
    }

    return NextResponse.json({ success: true, message: newMsg }, { status: 201 });
  } catch (err) {
    console.error('POST /api/user/tickets/[id]/reply error:', err);
    return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 });
  }
});
