import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRow, appendRow, generateId, now } from '@/lib/sheets';
import { Lead, LeadNote } from '@/types/schema';

export const POST = withRole(['admin', 'superadmin', 'staff'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();
    const { note } = body;

    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'Note content cannot be empty' }, { status: 400 });
    }

    const lead = await findRow<Lead>('Leads', (l) => l.id === id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const newNote: LeadNote = {
      id: generateId(),
      leadId: id,
      authorEmail: user.email,
      note: note.trim(),
      timestamp: now(),
    };

    await appendRow<LeadNote>('LeadNotes', newNote);

    return NextResponse.json({ success: true, note: newNote }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/leads/[id]/notes error:', err);
    return NextResponse.json({ error: 'Failed to add lead note' }, { status: 500 });
  }
});
