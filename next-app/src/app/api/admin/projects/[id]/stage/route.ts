import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRow, updateRow, appendRow, generateId, now } from '@/lib/sheets';
import { triggerPusher } from '@/lib/pusher';
import { sendNotification } from '@/lib/notify';
import { auditLog } from '@/lib/auditLog';
import { sendEmail } from '@/lib/emailSender';
import { templateStageChange } from '@/lib/emails/templates';
import { Project, StageHistory, ProjectStage } from '@/types/schema';

const STAGE_PROGRESS_MAP: Record<ProjectStage, number> = {
  Discovery: 0,
  Design: 20,
  Development: 40,
  Testing: 60,
  Review: 80,
  Launched: 100,
};

export const PUT = withRole(['admin', 'superadmin', 'staff'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();
    const { stage, notes } = body as { stage: ProjectStage; notes?: string };

    if (!stage || !(stage in STAGE_PROGRESS_MAP)) {
      return NextResponse.json({ error: 'Invalid project stage' }, { status: 400 });
    }

    const project = await findRow<Project>('Projects', (p) => p.id === id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const progress = STAGE_PROGRESS_MAP[stage];
    const updates: Partial<Project> = {
      stage,
      progress,
      ...(stage === 'Launched' ? { actualLaunch: now() } : {}),
    };

    const updatedProject = await updateRow<Project>('Projects', id, updates);

    // Record stage history in Google Sheets
    await appendRow<StageHistory>('StageHistory', {
      id: generateId(),
      projectId: id,
      stage,
      changedBy: user.email,
      notes: notes || `Stage updated to ${stage}`,
      timestamp: now(),
    });

    // Realtime Pusher broadcast
    await triggerPusher(`project-${id}`, 'stage-update', {
      stage,
      progress,
      updatedBy: user.email,
    });

    // Send notification to client
    await sendNotification(
      project.clientId,
      'stage_change',
      `Project Stage Updated: ${stage}`,
      `Your project ${project.name} has moved to ${stage}.`,
      `/user/projects/${id}`
    );

    // Send stage update email
    if (project.clientEmail) {
      const emailContent = templateStageChange(project.clientName, project.name, stage, notes);
      await sendEmail({
        to: project.clientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    }

    // Audit log
    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UPDATE_PROJECT_STAGE',
      resourceType: 'project',
      resourceId: id,
      resourceName: project.name,
      details: { from: project.stage, to: stage, notes },
      req,
    });

    return NextResponse.json({ success: true, project: updatedProject });
  } catch (err) {
    console.error('PUT /api/admin/projects/[id]/stage error:', err);
    return NextResponse.json({ error: 'Failed to update project stage' }, { status: 500 });
  }
});
