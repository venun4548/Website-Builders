import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRow, updateRow } from '@/lib/sheets';
import Razorpay from 'razorpay';
import { Invoice } from '@/types/schema';

export const POST = withRole(['client', 'admin', 'superadmin'])(async (req, { user }) => {
  try {
    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const invoice = await findRow<Invoice>('Invoices', (i) => i.id === invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'Paid') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const amountInPaise = Math.round(Number(invoice.totalAmount) * 100);

    let orderId = `order_${Date.now()}_mock`;

    if (keyId && keySecret && !keyId.includes('mock') && !keySecret.includes('mock')) {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: invoice.id,
        notes: {
          invoiceId: invoice.id,
          projectName: invoice.projectName,
          clientId: invoice.clientId,
        },
      });
      orderId = order.id;
    }

    // Save order ID to invoice
    await updateRow<Invoice>('Invoices', invoice.id, { razorpayOrderId: orderId });

    return NextResponse.json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
      invoice,
    });
  } catch (err) {
    console.error('POST /api/payments/create-order error:', err);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
});
