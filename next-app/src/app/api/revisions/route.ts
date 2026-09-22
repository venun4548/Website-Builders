import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getActiveRows, findRows, appendRow, generateId, now } from '@/lib/sheets';
import { sendPushNotification } from '@/lib/push';
import { sendEmail } from '@/lib/emailSender';
import { RevisionRequest, RevisionAnnotation, Project, User } from '@/types/schema';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    const [allRevs, allAnnots] = await Promise.all([
      getActiveRows<RevisionRequest>('RevisionRequests'),
      getActiveRows<RevisionAnnotation>('RevisionAnnotations'),
    ]);

    let revisions = allRevs;
    if (user.role === 'client') {
      revisions = revisions.filter((r) => r.clientId === user.userId);
    }

    if (projectId) {
      revisions = revisions.filter((r) => r.projectId === projectId);
    }

    // Attach annotations and filter internal remarks for clients
    const results = revisions.map((rev) => {
      const annots = allAnnots.filter((a) => a.revisionId === rev.id);
      return {
        ...rev,
        annotations: annots,
        // Shield internal remarks from clients
        internalRemarks: user.role === 'client' ? undefined : rev.internalRemarks,
      };
    });

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ revisions: results });
  } catch (err: any) {
    console.error('Error fetching revisions:', err);
    return NextResponse.json({ error: 'Failed to fetch revisions.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      projectId,
      designId,
      designName,
      description,
      priority = 'Medium',
      annotations = [],
    } = body;

    if (!projectId || !description) {
      return NextResponse.json(
        { error: 'Project ID and description are required.' },
        { status: 400 }
      );
    }

    const project = await getActiveRows<Project>('Projects').then((list) =>
      list.find((p) => p.id === projectId)
    );

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    if (user.role === 'client' && project.clientId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const revId = `REV-${Date.now()}-${generateId().slice(0, 4)}`;

    const newRev = await appendRow<RevisionRequest>('RevisionRequests', {
      id: revId,
      projectId: project.id,
      clientId: user.userId,
      clientName: user.name || user.email,
      clientEmail: user.email || project.clientEmail || '',
      designId: designId || 'general',
      designName: designName || 'Design Deliverable',
      description,
      priority,
      status: 'Open',
      createdAt: now(),
      updatedAt: now(),
    });

    // Append normalized annotations (0-1 coordinates)
    for (const ann of annotations) {
      await appendRow<RevisionAnnotation>('RevisionAnnotations', {
        id: `ANN-${Date.now()}-${generateId().slice(0, 4)}`,
        revisionId: revId,
        type: ann.type || 'point',
        x: Number(ann.x) || 0,
        y: Number(ann.y) || 0,
        width: Number(ann.width) || 0,
        height: Number(ann.height) || 0,
        points: ann.points || '',
        text: ann.text || '',
        createdAt: now(),
      });
    }

    // Send push / email notification to admin & staff
    const adminEmail = 'websitebuildeers@gmail.com';
    sendEmail({
      to: adminEmail,
      recipientName: 'Admin Team',
      subject: `New Revision Request: ${project.name} (${priority})`,
      html: `
        <div style="font-family: sans-serif; color: #1e293b;">
          <h2>New Revision Submitted</h2>
          <p><strong>Project:</strong> ${project.name} (${project.id})</p>
          <p><strong>Client:</strong> ${user.name || user.email}</p>
          <p><strong>Priority:</strong> ${priority}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><a href="https://website-builders-wine.vercel.app/admin/revisions">View in Admin Portal</a></p>
        </div>
      `,
      type: 'revision_update',
      relatedId: revId,
    }).catch(console.warn);

    return NextResponse.json({ success: true, revision: newRev });
  } catch (err: any) {
    console.error('Error creating revision request:', err);
    return NextResponse.json({ error: 'Failed to submit revision.' }, { status: 500 });
  }
}
