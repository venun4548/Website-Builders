import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { getActiveRows, appendRow, generateId, now } from '@/lib/sheets';
import { getNextInvoiceNumber } from '@/lib/invoiceNumber';
import { auditLog } from '@/lib/auditLog';
import { Invoice, InvoiceItem } from '@/types/schema';

export const GET = withRole(['admin', 'superadmin', 'staff'])(async (req, { user }) => {
  try {
    const invoices = await getActiveRows<Invoice>('Invoices');
    const items = await getActiveRows<InvoiceItem>('InvoiceItems');

    const invoicesWithItems = invoices.map((inv) => ({
      ...inv,
      items: items.filter((item) => item.invoiceId === inv.id),
    }));

    return NextResponse.json({ invoices: invoicesWithItems });
  } catch (err) {
    console.error('GET /api/admin/invoices error:', err);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
});

export const POST = withRole(['admin', 'superadmin'])(async (req, { user }) => {
  try {
    const body = await req.json();
    const { projectId, projectName, clientId, clientName, clientEmail, items, dueDate } = body;

    if (!projectId || !clientId || !clientEmail || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required invoice details or line items' }, { status: 400 });
    }

    const invoiceId = await getNextInvoiceNumber();

    // Calculate subtotal from line items
    let subtotal = 0;
    const formattedItems: InvoiceItem[] = [];

    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.rate) || 0;
      const lineAmount = qty * rate;
      subtotal += lineAmount;

      formattedItems.push({
        id: generateId(),
        invoiceId,
        description: item.description || 'Web Engineering Service',
        quantity: qty,
        rate,
        amount: lineAmount,
      });
    }

    const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const totalAmount = Math.round((subtotal + gstAmount) * 100) / 100;

    const invoice: Invoice = {
      id: invoiceId,
      projectId,
      projectName: projectName || 'Digital Build',
      clientId,
      clientName: clientName || 'Client',
      clientEmail,
      amount: subtotal,
      gstAmount,
      totalAmount,
      status: 'Draft',
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: now(),
      updatedAt: now(),
    };

    // Save invoice to Invoices tab
    await appendRow<Invoice>('Invoices', invoice);

    // Save line items to InvoiceItems tab
    for (const item of formattedItems) {
      await appendRow<InvoiceItem>('InvoiceItems', item);
    }

    // Audit log
    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CREATE_INVOICE',
      resourceType: 'invoice',
      resourceId: invoiceId,
      resourceName: `${invoiceId} (${projectName})`,
      details: { totalAmount, subtotal, gstAmount },
      req,
    });

    return NextResponse.json({ success: true, invoice: { ...invoice, items: formattedItems } }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/invoices error:', err);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
});
