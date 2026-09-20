import { getActiveRows } from './sheets';
import { Invoice } from '@/types/schema';

export async function getNextInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  try {
    const invoices = await getActiveRows<Invoice>('Invoices');
    let maxNum = 0;

    for (const inv of invoices) {
      if (inv.id && inv.id.startsWith(prefix)) {
        const numPart = parseInt(inv.id.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    }

    const nextNum = (maxNum + 1).toString().padStart(4, '0');
    return `${prefix}${nextNum}`;
  } catch (err) {
    console.warn('Failed to calculate next invoice number, fallback to random sequence:', err);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${rand}`;
  }
}
