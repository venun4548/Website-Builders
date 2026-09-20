import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRow, findRows } from '@/lib/sheets';
import { Project, StageHistory, ProjectFile } from '@/types/schema';

export const GET = withRole(['client', 'admin', 'superadmin'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const project = await findRow<Project>('Projects', (p) => p.id === id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify ownership if role is client
    if (
      user.role === 'client' &&
      project.clientId !== user.userId &&
      project.clientEmail?.toLowerCase() !== user.email.toLowerCase()
    ) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    const stageHistory = await findRows<StageHistory>('StageHistory', (h) => h.projectId === id);
    const files = await findRows<ProjectFile>('Files', (f) => f.projectId === id);

    return NextResponse.json({ project, stageHistory, files });
  } catch (err) {
    console.error('GET /api/user/projects/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch project details' }, { status: 500 });
  }
});
