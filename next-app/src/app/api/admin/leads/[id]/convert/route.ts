import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { findRow, updateRow, appendRow, generateId, now } from '@/lib/sheets';
import { auditLog } from '@/lib/auditLog';
import { sendNotification } from '@/lib/notify';
import { Lead, User, Project, StageHistory, ProjectTier } from '@/types/schema';

export const POST = withRole(['admin', 'superadmin'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json().catch(() => ({}));
    const { tier = 'Professional', projectName } = body;

    const lead = await findRow<Lead>('Leads', (l) => l.id === id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // 1. Check or create User for client
    let clientUser = await findRow<User>('Users', (u) => u.email?.toLowerCase() === lead.email.toLowerCase());
    if (!clientUser) {
      const tempSalt = await bcrypt.genSalt(12);
      const defaultHash = await bcrypt.hash('Welcome@2026', tempSalt);
      const newUserId = generateId();

      clientUser = {
        id: newUserId,
        email: lead.email.toLowerCase(),
        passwordHash: defaultHash,
        name: lead.name,
        company: '',
        role: 'client',
        isEmailVerified: 'true',
        onboardingComplete: 'false',
        createdAt: now(),
        updatedAt: now(),
      };
      await appendRow<User>('Users', clientUser);
    }

    // 2. Create Project in Projects tab
    const projectId = generateId();
    const finalProjectName = projectName || `${lead.name}'s Web Platform`;
    const projectTier: ProjectTier = tier || 'Professional';

    const project: Project = {
      id: projectId,
      clientId: clientUser.id,
      clientName: lead.name,
      clientEmail: lead.email,
      name: finalProjectName,
      tier: projectTier,
      stage: 'Discovery',
      progress: 0,
      assignedStaff: JSON.stringify([]),
      estimatedLaunch: '',
      createdAt: now(),
      updatedAt: now(),
    };

    await appendRow<Project>('Projects', project);

    // 3. Create initial stage history
    await appendRow<StageHistory>('StageHistory', {
      id: generateId(),
      projectId,
      stage: 'Discovery',
      changedBy: user.email,
      notes: `Lead converted to project by ${user.email}`,
      timestamp: now(),
    });

    // 4. Update lead status to 'Won' and set convertedProjectId
    await updateRow<Lead>('Leads', lead.id, {
      status: 'Won',
      convertedProjectId: projectId,
    });

    // 5. Send notification to client
    await sendNotification(
      clientUser.id,
      'stage_change',
      `Welcome! Project Initialized: ${finalProjectName}`,
      `Your project has been approved and moved into the Discovery phase. Complete your onboarding to get started!`,
      `/user/onboarding`
    );

    // 6. Audit log
    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CONVERT_LEAD',
      resourceType: 'lead',
      resourceId: lead.id,
      resourceName: lead.name,
      details: { projectId, projectName: finalProjectName, tier: projectTier },
      req,
    });

    return NextResponse.json({
      success: true,
      message: 'Lead converted to project successfully',
      projectId,
      project,
    });
  } catch (err) {
    console.error('POST /api/admin/leads/[id]/convert error:', err);
    return NextResponse.json({ error: 'Failed to convert lead to project' }, { status: 500 });
  }
});
