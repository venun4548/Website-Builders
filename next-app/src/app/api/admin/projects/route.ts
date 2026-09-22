import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { getActiveRows, appendRow, generateId, now } from '@/lib/sheets';
import { auditLog } from '@/lib/auditLog';
import { sendNotification } from '@/lib/notify';
import { Project, StageHistory, ProjectStage, ProjectTier } from '@/types/schema';

const STAGE_PROGRESS_MAP: Record<ProjectStage, number> = {
  Discovery: 0,
  Design: 20,
  Development: 40,
  Testing: 60,
  Review: 80,
  Launched: 100,
};

export const GET = withRole(['admin', 'superadmin', 'staff'])(async (req, { user }) => {
  try {
    const projects = await getActiveRows<Project>('Projects');
    return NextResponse.json({ projects });
  } catch (err) {
    console.error('GET /api/admin/projects error:', err);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
});

export const POST = withRole(['admin', 'superadmin'])(async (req, { user }) => {
  try {
    const body = await req.json();
    const { clientId, clientName, clientEmail, name, tier, estimatedLaunch } = body;

    if (!clientId || !clientName || !clientEmail || !name) {
      return NextResponse.json({ error: 'Missing required project fields' }, { status: 400 });
    }

    const projectId = generateId();
    const projectTier = (tier || 'Professional') as ProjectTier;
    const initialStage: ProjectStage = 'Discovery';

    const project: Project = {
      id: projectId,
      clientId,
      clientName,
      clientEmail,
      name,
      tier: projectTier,
      stage: initialStage,
      progress: STAGE_PROGRESS_MAP[initialStage],
      assignedStaff: JSON.stringify([]),
      estimatedLaunch: estimatedLaunch || '',
      createdAt: now(),
      updatedAt: now(),
    };

    await appendRow<Project>('Projects', project);

    // Initial stage history
    await appendRow<StageHistory>('StageHistory', {
      id: generateId(),
      projectId,
      clientName: clientName || '',
      clientEmail: clientEmail || '',
      stage: initialStage,
      changedBy: user.email,
      notes: 'Project created and initialized in Discovery stage.',
      timestamp: now(),
    });

    // Notify client
    await sendNotification(
      clientId,
      'stage_change',
      `New Project Created: ${name}`,
      `Your project ${name} has been initiated in Discovery stage.`,
      `/user/projects`
    );

    // Audit log
    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CREATE_PROJECT',
      resourceType: 'project',
      resourceId: projectId,
      resourceName: name,
      details: { tier: projectTier, clientEmail },
      req,
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/projects error:', err);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
});
