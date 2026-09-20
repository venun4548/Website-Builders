import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { findRow, findRows } from '@/lib/sheets';
import { generateInvoiceHtml } from '@/lib/generateInvoicePdf';
import { Invoice, InvoiceItem } from '@/types/schema';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoice = await findRow<Invoice>('Invoices', (i) => i.id === id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (
      user.role === 'client' &&
      invoice.clientId !== user.userId &&
      invoice.clientEmail?.toLowerCase() !== user.email.toLowerCase()
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const items = await findRows<InvoiceItem>('InvoiceItems', (item) => item.invoiceId === id);
    const html = generateInvoiceHtml(invoice, items);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (err) {
    console.error('GET /api/invoices/[id]/pdf error:', err);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
