import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRows, appendRow, generateId, now } from '@/lib/sheets';
import { getNextTicketNumber } from '@/lib/ticketNumber';
import { sendEmail } from '@/lib/emailSender';
import { templateTicketCreated } from '@/lib/emails/templates';
import { auditLog } from '@/lib/auditLog';
import { Ticket, TicketMessage, TicketPriority } from '@/types/schema';

export const GET = withRole(['client', 'admin', 'superadmin'])(async (req, { user }) => {
  try {
    const tickets = await findRows<Ticket>(
      'Tickets',
      (t) => t.clientId === user.userId || t.clientEmail?.toLowerCase() === user.email.toLowerCase()
    );
    return NextResponse.json({ tickets });
  } catch (err) {
    console.error('GET /api/user/tickets error:', err);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
});

export const POST = withRole(['client', 'admin', 'superadmin'])(async (req, { user }) => {
  try {
    const body = await req.json();
    const { subject, priority, initialMessage } = body;

    if (!subject || !initialMessage) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    const ticketId = await getNextTicketNumber();
    const ticketPriority: TicketPriority = priority || 'Medium';

    const ticket: Ticket = {
      id: ticketId,
      clientId: user.userId,
      clientName: user.name || 'Client',
      clientEmail: user.email,
      subject: subject.trim(),
      priority: ticketPriority,
      status: 'Open',
      assignedTo: '',
      createdAt: now(),
      updatedAt: now(),
    };

    await appendRow<Ticket>('Tickets', ticket);

    // Initial message
    const messageRecord: TicketMessage = {
      id: generateId(),
      ticketId,
      senderEmail: user.email,
      senderRole: user.role,
      message: initialMessage.trim(),
      timestamp: now(),
    };

    await appendRow<TicketMessage>('TicketMessages', messageRecord);

    // Send confirmation email to client
    const emailData = templateTicketCreated(user.name || 'Client', ticketId, subject);
    await sendEmail({
      to: user.email,
      subject: emailData.subject,
      html: emailData.html,
    });

    // Audit log
    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CREATE_TICKET',
      resourceType: 'ticket',
      resourceId: ticketId,
      resourceName: subject,
      details: { priority: ticketPriority },
      req,
    });

    return NextResponse.json({ success: true, ticket, message: messageRecord }, { status: 201 });
  } catch (err) {
    console.error('POST /api/user/tickets error:', err);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
});
