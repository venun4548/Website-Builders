import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRow, updateRow } from '@/lib/sheets';
import { sendNotification } from '@/lib/notify';
import { sendEmail } from '@/lib/emailSender';
import { templateInvoiceCreated } from '@/lib/emails/templates';
import { auditLog } from '@/lib/auditLog';
import { Invoice } from '@/types/schema';

export const POST = withRole(['admin', 'superadmin'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const invoice = await findRow<Invoice>('Invoices', (i) => i.id === id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updated = await updateRow<Invoice>('Invoices', id, { status: 'Sent' });

    // Send email to client
    if (invoice.clientEmail) {
      const emailContent = templateInvoiceCreated(
        invoice.clientName,
        invoice.id,
        invoice.totalAmount,
        invoice.dueDate
      );
      await sendEmail({
        to: invoice.clientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    }

    // Send in-app notification
    await sendNotification(
      invoice.clientId,
      'invoice',
      `New Invoice Issued: ${invoice.id}`,
      `An invoice for ₹${Number(invoice.totalAmount).toLocaleString('en-IN')} has been generated. Due date: ${invoice.dueDate}.`,
      `/user/invoices`
    );

    // Audit log
    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'SEND_INVOICE',
      resourceType: 'invoice',
      resourceId: invoice.id,
      resourceName: invoice.id,
      details: { totalAmount: invoice.totalAmount, clientEmail: invoice.clientEmail },
      req,
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (err) {
    console.error('POST /api/admin/invoices/[id]/send error:', err);
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 });
  }
});
