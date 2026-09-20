import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRows, getActiveRows } from '@/lib/sheets';
import { Invoice, InvoiceItem } from '@/types/schema';

export const GET = withRole(['client', 'admin', 'superadmin'])(async (req, { user }) => {
  try {
    const invoices = await findRows<Invoice>(
      'Invoices',
      (i) => i.clientId === user.userId || i.clientEmail?.toLowerCase() === user.email.toLowerCase()
    );

    const allItems = await getActiveRows<InvoiceItem>('InvoiceItems');

    const invoicesWithItems = invoices.map((inv) => ({
      ...inv,
      items: allItems.filter((item) => item.invoiceId === inv.id),
    }));

    return NextResponse.json({ invoices: invoicesWithItems });
  } catch (err) {
    console.error('GET /api/user/invoices error:', err);
    return NextResponse.json({ error: 'Failed to fetch user invoices' }, { status: 500 });
  }
});
