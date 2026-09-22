import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getActiveRows, appendRow, generateId, now } from '@/lib/sheets';
import { sendEmail } from '@/lib/emailSender';
import { MaintenanceRequest, Project, User } from '@/types/schema';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    const allRequests = await getActiveRows<MaintenanceRequest>('MaintenanceRequests');

    let filtered = allRequests;
    if (user.role === 'client') {
      filtered = filtered.filter((r) => r.clientId === user.userId);
    } else if (user.role === 'staff') {
      filtered = filtered.filter((r) => r.assignedTo === user.userId || r.assignedTo === user.email);
    }

    if (projectId) {
      filtered = filtered.filter((r) => r.projectId === projectId);
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ requests: filtered });
  } catch (err: any) {
    console.error('Error fetching maintenance requests:', err);
    return NextResponse.json({ error: 'Failed to fetch maintenance requests.' }, { status: 500 });
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
      title,
      description,
      category = 'Content Update',
      priority = 'Medium',
    } = body;

    if (!projectId || !title || !description) {
      return NextResponse.json(
        { error: 'Project, Title, and Description are required.' },
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

    const reqId = `MNT-${Date.now()}-${generateId().slice(0, 4)}`;

    const newReq = await appendRow<MaintenanceRequest>('MaintenanceRequests', {
      id: reqId,
      projectId: project.id,
      clientId: user.userId,
      clientName: user.name || user.email,
      clientEmail: user.email,
      title,
      description,
      category,
      priority,
      status: 'Submitted',
      clientApproval: 'Pending',
      createdAt: now(),
      updatedAt: now(),
    });

    // Email Admin
    sendEmail({
      to: 'websitebuildeers@gmail.com',
      recipientName: 'Maintenance Team',
      subject: `New Maintenance Request: ${title} (${priority})`,
      html: `
        <div style="font-family: sans-serif; color: #1e293b;">
          <h2>New Post-Launch Maintenance Request</h2>
          <p><strong>Project:</strong> ${project.name} (${project.id})</p>
          <p><strong>Client:</strong> ${user.name || user.email}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Priority:</strong> ${priority}</p>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><a href="https://website-builders-wine.vercel.app/admin/maintenance">Review in Admin Portal</a></p>
        </div>
      `,
      type: 'maintenance',
      relatedId: reqId,
    }).catch(console.warn);

    return NextResponse.json({ success: true, request: newReq });
  } catch (err: any) {
    console.error('Error submitting maintenance request:', err);
    return NextResponse.json({ error: 'Failed to submit maintenance request.' }, { status: 500 });
  }
}
