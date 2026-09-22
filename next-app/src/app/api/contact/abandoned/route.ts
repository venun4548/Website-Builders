import { NextRequest, NextResponse } from 'next/server';
import { findRow, appendRow, updateRow, generateId, now } from '@/lib/sheets';
import { AbandonedContact } from '@/types/schema';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, email, name } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanSessionId = sessionId || `sess_${Date.now()}`;

    // Check if session already recorded
    const existing = await findRow<AbandonedContact>(
      'AbandonedContacts',
      (a) => a.sessionId === cleanSessionId || a.email.toLowerCase() === cleanEmail
    );

    if (existing) {
      await updateRow<AbandonedContact>('AbandonedContacts', existing.id, {
        lastActivityAt: now(),
        name: name || existing.name,
      });
      return NextResponse.json({ success: true, updated: true });
    }

    await appendRow<AbandonedContact>('AbandonedContacts', {
      id: `AC-${Date.now()}-${generateId().slice(0, 4)}`,
      sessionId: cleanSessionId,
      email: cleanEmail,
      name: name || '',
      startedAt: now(),
      lastActivityAt: now(),
      abandonedAt: now(),
      followUpSent: 'false',
      status: 'pending',
    });

    return NextResponse.json({ success: true, created: true });
  } catch (err: any) {
    console.error('Error recording abandoned contact:', err);
    return NextResponse.json({ error: 'Failed to record session' }, { status: 500 });
  }
}
