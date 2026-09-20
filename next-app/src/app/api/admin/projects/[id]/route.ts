import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRow, findRows, updateRow } from '@/lib/sheets';
import { Project, StageHistory, ProjectFile } from '@/types/schema';

export const GET = withRole(['admin', 'superadmin', 'staff'])(async (req, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const project = await findRow<Project>('Projects', (p) => p.id === id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const stageHistory = await findRows<StageHistory>('StageHistory', (h) => h.projectId === id);
    const files = await findRows<ProjectFile>('Files', (f) => f.projectId === id);

    return NextResponse.json({ project, stageHistory, files });
  } catch (err) {
    console.error('GET /api/admin/projects/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch project details' }, { status: 500 });
  }
});

export const PUT = withRole(['admin', 'superadmin'])(async (req, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();

    const updated = await updateRow<Project>('Projects', id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, project: updated });
  } catch (err) {
    console.error('PUT /api/admin/projects/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
});
