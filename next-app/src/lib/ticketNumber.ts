import { getActiveRows } from './sheets';
import { Ticket } from '@/types/schema';

export async function getNextTicketNumber(): Promise<string> {
  const prefix = 'TKT-';

  try {
    const tickets = await getActiveRows<Ticket>('Tickets');
    let maxNum = 0;

    for (const tkt of tickets) {
      if (tkt.id && tkt.id.startsWith(prefix)) {
        const numPart = parseInt(tkt.id.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    }

    const nextNum = (maxNum + 1).toString().padStart(4, '0');
    return `${prefix}${nextNum}`;
  } catch (err) {
    console.warn('Failed to calculate next ticket number, fallback to random sequence:', err);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${rand}`;
  }
}
