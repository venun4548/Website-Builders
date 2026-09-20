import { Invoice, InvoiceItem } from '@/types/schema';

export function generateInvoiceHtml(invoice: Invoice, items: InvoiceItem[]): string {
  const subtotal = Number(invoice.amount) || 0;
  const gst = Number(invoice.gstAmount) || subtotal * 0.18;
  const total = Number(invoice.totalAmount) || subtotal + gst;
  const cgst = gst / 2;
  const sgst = gst / 2;

  const itemRows = items
    .map(
      (item, idx) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: center;">${idx + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px;"><strong>${item.description}</strong></td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: right;">₹${Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: right; font-weight: 600;">₹${Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>
  `
    )
    .join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Tax Invoice - ${invoice.id}</title>
    <style>
      body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #1e293b; margin: 0; padding: 40px; background-color: #ffffff; }
      .invoice-box { max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
      .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
      .brand-title { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
      .brand-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
      .invoice-title { font-size: 24px; font-weight: 800; color: #3b82f6; text-align: right; text-transform: uppercase; }
      .meta-box { text-align: right; font-size: 13px; color: #475569; margin-top: 8px; }
      .details-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
      .col { width: 48%; }
      .col h4 { font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 8px; }
      .col p { margin: 3px 0; font-size: 14px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background-color: #f8fafc; color: #475569; font-size: 12px; text-transform: uppercase; padding: 12px; border-bottom: 2px solid #cbd5e1; }
      .totals-area { display: flex; justify-content: flex-end; margin-top: 30px; }
      .totals-table { width: 320px; font-size: 14px; }
      .totals-table td { padding: 8px 12px; }
      .grand-total { font-size: 18px; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; }
      .status-pill { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
      .status-paid { background: #dcfce7; color: #15803d; }
      .status-sent { background: #e0e7ff; color: #4338ca; }
      .status-draft { background: #f1f5f9; color: #475569; }
      .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
    </style>
  </head>
  <body>
    <div class="invoice-box">
      <div class="header-row">
        <div>
          <div class="brand-title">WEBSITE BUILDERS</div>
          <div class="brand-sub">Premium Web Engineering & Digital Experiences</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
            GSTIN: 27AAAAA0000A1Z5 | PAN: AAAAA0000A<br>
            Email: websitebuilders@gmail.com
          </div>
        </div>
        <div>
          <div class="invoice-title">TAX INVOICE</div>
          <div class="meta-box">
            <strong>Invoice No:</strong> ${invoice.id}<br>
            <strong>Date:</strong> ${new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN')}<br>
            <strong>Due Date:</strong> ${invoice.dueDate}<br>
            <div style="margin-top: 8px;">
              <span class="status-pill status-${(invoice.status || 'draft').toLowerCase()}">${invoice.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="details-grid">
        <div class="col">
          <h4>Billed To:</h4>
          <p><strong>${invoice.clientName}</strong></p>
          <p>${invoice.clientEmail}</p>
          <p>Project: <strong>${invoice.projectName}</strong></p>
        </div>
        <div class="col" style="text-align: right;">
          <h4>Payment Method:</h4>
          <p>Online Payment via Razorpay</p>
          ${invoice.paidAt ? `<p style="color: #10b981; font-weight: 600;">Paid on: ${new Date(invoice.paidAt).toLocaleDateString('en-IN')}</p>` : ''}
          ${invoice.razorpayPaymentId ? `<p style="font-size: 12px; color: #64748b;">Ref: ${invoice.razorpayPaymentId}</p>` : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th style="text-align: left;">Item Description</th>
            <th style="width: 70px; text-align: center;">Qty</th>
            <th style="width: 120px; text-align: right;">Rate (₹)</th>
            <th style="width: 140px; text-align: right;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || `
            <tr>
              <td style="padding: 12px; text-align: center;">1</td>
              <td style="padding: 12px;">${invoice.projectName} Development Services</td>
              <td style="padding: 12px; text-align: center;">1</td>
              <td style="padding: 12px; text-align: right;">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td style="padding: 12px; text-align: right; font-weight: 600;">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          `}
        </tbody>
      </table>

      <div class="totals-area">
        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td style="text-align: right; font-weight: 600;">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td>CGST (9%):</td>
            <td style="text-align: right;">₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td>SGST (9%):</td>
            <td style="text-align: right;">₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr class="grand-total">
            <td>Grand Total:</td>
            <td style="text-align: right;">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <p>This is a computer-generated tax invoice. No signature is required.</p>
        <p>Website Builders Co. • websitebuilders@gmail.com • https://website-builders-wine.vercel.app</p>
      </div>
    </div>
  </body>
  </html>
  `;
}
