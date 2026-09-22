import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { findRow, findRows, appendRow, updateRow, generateId, now } from '@/lib/sheets';
import { generateMonthlyReportPdf, MonthlyReportData } from '@/lib/generateMonthlyReportPdf';
import { Project, MonthlyReport, StageHistory, User } from '@/types/schema';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, clientId, month, year, regenerate } = body;

    if (!projectId || !month || !year) {
      return NextResponse.json(
        { error: 'Project ID, Month, and Year are required.' },
        { status: 400 }
      );
    }

    // Fetch Project
    const project = await findRow<Project>('Projects', (p) => p.id === projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    // Role check: Client can only generate/download their own project report
    if (user.role === 'client' && project.clientId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden: Cannot access this project.' }, { status: 403 });
    }

    // Fetch Client info
    const targetClientId = clientId || project.clientId;
    const clientUser = await findRow<User>('Users', (u) => u.id === targetClientId);
    const clientName = clientUser?.name || project.clientName || 'Valued Client';
    const clientEmail = clientUser?.email || project.clientEmail || user.email;
    const clientCompany = clientUser?.company || 'Organization';

    // Duplicate Prevention Check in MonthlyReports
    const existingReports = await findRows<MonthlyReport>(
      'MonthlyReports',
      (r) =>
        r.projectId === projectId &&
        r.month.toLowerCase() === String(month).toLowerCase() &&
        String(r.year) === String(year)
    );

    const existing = existingReports[0];
    if (existing && !regenerate && (existing.status === 'Generated' || existing.status === 'Sent')) {
      console.log(`[MONTHLY REPORT] Report already exists for ${projectId} ${month}/${year}`);
    }

    // Fetch stage history & updates
    const stageHistory = await findRows<StageHistory>('StageHistory', (s) => s.projectId === projectId);
    const workCompleted = stageHistory.map((s) => ({
      date: s.timestamp ? s.timestamp.slice(0, 10) : now().slice(0, 10),
      stage: s.stage,
      activity: s.notes || `Milestone reached: ${s.stage}`,
      responsible: s.changedBy || 'Engineering Team',
    }));

    const startingProg = Math.max(0, (project.progress || 0) - 20);
    const endingProg = project.progress || 0;

    const reportId = existing ? existing.id : `MR-${year}-${month.slice(0, 3).toUpperCase()}-${generateId().slice(0, 4)}`;
    const fileName = `Report-${project.id}-${month}-${year}.pdf`;

    const reportData: MonthlyReportData = {
      reportId,
      clientName,
      clientCompany,
      clientEmail,
      projectId: project.id,
      projectName: project.name,
      projectTier: project.tier,
      month: String(month),
      year: String(year),
      currentStage: project.stage || 'Development',
      startingProgress: startingProg,
      endingProgress: endingProg,
      expectedDelivery: project.estimatedLaunch,
      workCompleted,
      pendingWork: [
        'Component integration testing',
        'Performance & accessibility verification',
        'Final client demonstration & walkthrough',
      ],
      nextSteps: [
        'Security hardening & DNS verification',
        'Staff training and support portal handover',
        'Production release deployment',
      ],
    };

    // Generate real binary PDF
    const pdfBytes = await generateMonthlyReportPdf(reportData);

    // Save or update metadata in MonthlyReports sheet
    if (existing) {
      await updateRow<MonthlyReport>('MonthlyReports', existing.id, {
        generatedAt: now(),
        generatedBy: user.email,
        status: 'Generated',
      });
    } else {
      await appendRow<MonthlyReport>('MonthlyReports', {
        id: reportId,
        clientId: targetClientId,
        clientName,
        clientEmail,
        projectId: project.id,
        projectName: project.name,
        month: String(month),
        year: String(year),
        fileName,
        generatedAt: now(),
        generatedBy: user.email,
        sentAt: '',
        emailStatus: 'Pending',
        status: 'Generated',
      });
    }

    // Return binary PDF
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    console.error('Error generating monthly report:', err);
    return NextResponse.json({ error: 'Failed to generate monthly report PDF.' }, { status: 500 });
  }
}
