import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRows } from '@/lib/sheets';
import { Project } from '@/types/schema';

export const GET = withRole(['client', 'admin', 'superadmin'])(async (req, { user }) => {
  try {
    const projects = await findRows<Project>(
      'Projects',
      (p) => p.clientId === user.userId || p.clientEmail?.toLowerCase() === user.email.toLowerCase()
    );
    return NextResponse.json({ projects });
  } catch (err) {
    console.error('GET /api/user/projects error:', err);
    return NextResponse.json({ error: 'Failed to fetch user projects' }, { status: 500 });
  }
});
