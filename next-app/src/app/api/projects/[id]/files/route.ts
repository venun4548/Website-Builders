import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { findRow, findRows, appendRow, generateId, now } from '@/lib/sheets';
import { triggerPusher } from '@/lib/pusher';
import { sendNotification } from '@/lib/notify';
import { sendEmail } from '@/lib/emailSender';
import { templateNewFileUploaded } from '@/lib/emails/templates';
import { auditLog } from '@/lib/auditLog';
import { Project, ProjectFile, FileCategory } from '@/types/schema';

export const GET = withRole(['client', 'admin', 'superadmin', 'staff'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const files = await findRows<ProjectFile>('Files', (f) => f.projectId === projectId);
    return NextResponse.json({ files });
  } catch (err) {
    console.error('GET /api/projects/[id]/files error:', err);
    return NextResponse.json({ error: 'Failed to fetch project files' }, { status: 500 });
  }
});

export const POST = withRole(['client', 'admin', 'superadmin', 'staff'])(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const project = await findRow<Project>('Projects', (p) => p.id === projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await req.json();
    const { fileName, fileUrl, fileSize, fileType, category } = body;

    if (!fileName || !fileUrl) {
      return NextResponse.json({ error: 'File name and file URL are required' }, { status: 400 });
    }

    const fileCat: FileCategory = category === 'Deliverable' ? 'Deliverable' : 'Asset';

    const newFile: ProjectFile = {
      id: generateId(),
      projectId,
      clientName: project.clientName || '',
      clientEmail: project.clientEmail || '',
      uploadedBy: user.email,
      fileName,
      fileUrl,
      fileSize: fileSize || '0 KB',
      fileType: fileType || 'application/octet-stream',
      category: fileCat,
      uploadedAt: now(),
    };

    await appendRow<ProjectFile>('Files', newFile);

    // Pusher realtime event
    await triggerPusher(`project-${projectId}`, 'file-uploaded', newFile);

    // If staff/admin uploaded a deliverable, notify client
    if (user.role !== 'client') {
      await sendNotification(
        project.clientId,
        'file',
        `New ${fileCat} Uploaded: ${fileName}`,
        `${fileName} has been added to your project files.`,
        `/user/projects/${projectId}`
      );

      if (project.clientEmail) {
        const emailContent = templateNewFileUploaded(
          project.clientName,
          project.name,
          fileName,
          fileCat
        );
        await sendEmail({
          to: project.clientEmail,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }
    }

    // Audit log
    await auditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UPLOAD_FILE',
      resourceType: 'project',
      resourceId: projectId,
      resourceName: `${project.name} (${fileName})`,
      details: { fileName, category: fileCat, fileUrl },
      req,
    });

    return NextResponse.json({ success: true, file: newFile }, { status: 201 });
  } catch (err) {
    console.error('POST /api/projects/[id]/files error:', err);
    return NextResponse.json({ error: 'Failed to record uploaded file' }, { status: 500 });
  }
});
