import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { getActiveRows } from '@/lib/sheets';
import { Lead, LeadNote } from '@/types/schema';

export const GET = withRole(['admin', 'superadmin', 'staff'])(async (req, { user }) => {
  try {
    const leads = await getActiveRows<Lead>('Leads');
    const notes = await getActiveRows<LeadNote>('LeadNotes');

    const leadsWithNotes = leads.map((lead) => ({
      ...lead,
      notes: notes.filter((n) => n.leadId === lead.id),
    }));

    return NextResponse.json({ leads: leadsWithNotes });
  } catch (err) {
    console.error('GET /api/admin/leads error:', err);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
});
