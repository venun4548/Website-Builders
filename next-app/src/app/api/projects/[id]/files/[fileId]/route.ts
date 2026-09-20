import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { deleteRow, findRow } from '@/lib/sheets';
import { ProjectFile } from '@/types/schema';

export const DELETE = withRole(['admin', 'superadmin', 'staff'])(async (req, { params }) => {
  try {
    const resolvedParams = await params;
    const fileId = resolvedParams.fileId;

    const file = await findRow<ProjectFile>('Files', (f) => f.id === fileId);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    await deleteRow('Files', fileId);
    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/projects/[id]/files/[fileId] error:', err);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
});
