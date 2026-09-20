import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRole } from '@/lib/auth';
import { findRow } from '@/lib/sheets';
import { ContactSubmission } from '@/types/schema';

export const GET = withRole(['client', 'admin', 'superadmin', 'staff'])(
  async (req: NextRequest, { user, params }) => {
    try {
      const resolvedParams = await params;
      const id = resolvedParams?.id;

      const idParse = z.string().uuid().safeParse(id);
      if (!idParse.success) {
        return NextResponse.json({ error: 'Invalid submission ID format.' }, { status: 400 });
      }

      const submission = await findRow<ContactSubmission>('ContactSubmissions', (s) => s.id === idParse.data);
      if (!submission) {
        return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
      }

      // Verify ownership or staff permissions
      const isOwner = submission.email.toLowerCase() === user.email.toLowerCase();
      const isAdmin = ['admin', 'superadmin', 'staff'].includes(user.role);

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden: You do not own this submission.' }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        submission,
      });
    } catch (err) {
      console.error('Submission lookup error:', err);
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
  }
);
