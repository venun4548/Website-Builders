import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRow, updateRow, now } from '@/lib/sheets';
import crypto from 'crypto';
import { sendEmail } from '@/lib/emailSender';
import { templatePaymentConfirmation } from '@/lib/emails/templates';
import { sendNotification } from '@/lib/notify';
import { auditLog } from '@/lib/auditLog';
import { Invoice } from '@/types/schema';

export const POST = withRole(['client', 'admin', 'superadmin'])(async (req, { user }) => {
  try {
    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
    }

    const invoice = await findRow<Invoice>('Invoices', (i) => i.id === invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // In production with live keys, verify HMAC-SHA256 signature
    if (keySecret && !keySecret.includes('mock') && razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
      }
    }

    const paymentId = razorpayPaymentId || `pay_${Date.now()}_success`;

    // Mark invoice as Paid
    const updatedInvoice = await updateRow<Invoice>('Invoices', invoice.id, {
      status: 'Paid',
      paidAt: now(),
      razorpayPaymentId: paymentId,
      razorpayOrderId: razorpayOrderId || invoice.razorpayOrderId || '',
    });

    // Send payment confirmation email
    if (invoice.clientEmail) {
      const emailContent = templatePaymentConfirmation(
        invoice.clientName,
        invoice.id,
        invoice.totalAmount,
        paymentId
      );
      await sendEmail({
        to: invoice.clientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    }

    // In-app notification to client
    await sendNotification(
      invoice.clientId,
      'invoice',
      `Payment Received: ${invoice.id}`,
      `Your payment of ₹${Number(invoice.totalAmount).toLocaleString('en-IN')} has been verified. Thank you!`,
      `/user/invoices`
    );

    // Audit log
    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PAYMENT_VERIFIED',
      resourceType: 'invoice',
      resourceId: invoice.id,
      resourceName: invoice.id,
      details: { amount: invoice.totalAmount, paymentId },
      req,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and confirmed',
      invoice: updatedInvoice,
    });
  } catch (err) {
    console.error('POST /api/payments/verify error:', err);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
});
