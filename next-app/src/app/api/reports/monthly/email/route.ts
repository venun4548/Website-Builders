import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { findRow, findRows, updateRow, appendRow, generateId, now } from '@/lib/sheets';
import { generateMonthlyReportPdf, MonthlyReportData } from '@/lib/generateMonthlyReportPdf';
import { sendEmail } from '@/lib/emailSender';
import { Project, MonthlyReport, StageHistory, User } from '@/types/schema';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { projectId, month, year } = await req.json();

    if (!projectId || !month || !year) {
      return NextResponse.json({ error: 'Project ID, Month, and Year are required.' }, { status: 400 });
    }

    const project = await findRow<Project>('Projects', (p) => p.id === projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const clientUser = await findRow<User>('Users', (u) => u.id === project.clientId);
    const clientName = clientUser?.name || project.clientName || 'Valued Client';
    const clientEmail = clientUser?.email || project.clientEmail;

    if (!clientEmail) {
      return NextResponse.json({ error: 'Client email not configured.' }, { status: 400 });
    }

    // Check existing record in MonthlyReports
    let existing = await findRow<MonthlyReport>(
      'MonthlyReports',
      (r) =>
        r.projectId === projectId &&
        r.month.toLowerCase() === String(month).toLowerCase() &&
        String(r.year) === String(year)
    );

    const reportId = existing ? existing.id : `MR-${year}-${month.slice(0, 3).toUpperCase()}-${generateId().slice(0, 4)}`;
    const fileName = `Report-${project.id}-${month}-${year}.pdf`;

    const stageHistory = await findRows<StageHistory>('StageHistory', (s) => s.projectId === projectId);
    const workCompleted = stageHistory.map((s) => ({
      date: s.timestamp ? s.timestamp.slice(0, 10) : now().slice(0, 10),
      stage: s.stage,
      activity: s.notes || `Milestone reached: ${s.stage}`,
      responsible: s.changedBy || 'Engineering Team',
    }));

    const reportData: MonthlyReportData = {
      reportId,
      clientName,
      clientCompany: clientUser?.company,
      clientEmail,
      projectId: project.id,
      projectName: project.name,
      projectTier: project.tier,
      month: String(month),
      year: String(year),
      currentStage: project.stage || 'Development',
      startingProgress: Math.max(0, (project.progress || 0) - 20),
      endingProgress: project.progress || 0,
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

    const pdfBytes = await generateMonthlyReportPdf(reportData);

    const emailSubject = `Your ${month} ${year} Project Report — Website Builders`;
    const emailHtml = `
      <div style="font-family: sans-serif; color: #1e293b; max-width: 600px;">
        <h2 style="color: #0f172a;">Your Monthly Project Report is Ready</h2>
        <p>Dear ${clientName},</p>
        <p>We are pleased to provide your comprehensive progress report for <strong>${project.name}</strong> for the period of <strong>${month} ${year}</strong>.</p>
        <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0;">
          <strong>Current Stage:</strong> ${project.stage}<br>
          <strong>Current Progress:</strong> ${project.progress}%<br>
          <strong>Expected Launch:</strong> ${project.estimatedLaunch || 'On Schedule'}
        </div>
        <p>Please find the official verified PDF report attached to this email for your records.</p>
        <p>If you have any questions or would like to discuss upcoming milestones, feel free to reply to this email or access your client portal.</p>
        <p style="font-size: 12px; color: #64748b; margin-top: 30px;">Website Builders Engineering Team • websitebuildeers@gmail.com</p>
      </div>
    `;

    const emailSuccess = await sendEmail({
      to: clientEmail,
      recipientName: clientName,
      subject: emailSubject,
      html: emailHtml,
      type: 'monthly_report',
      relatedId: project.id,
      attachments: [
        {
          filename: fileName,
          content: Buffer.from(pdfBytes),
          contentType: 'application/pdf',
        },
      ],
    });

    const statusVal = emailSuccess ? 'Sent' : 'Failed';
    const emailStatusVal = emailSuccess ? 'Sent' : 'Failed';

    if (existing) {
      await updateRow<MonthlyReport>('MonthlyReports', existing.id, {
        sentAt: now(),
        emailStatus: emailStatusVal,
        status: statusVal,
      });
    } else {
      await appendRow<MonthlyReport>('MonthlyReports', {
        id: reportId,
        clientId: project.clientId,
        clientName,
        clientEmail,
        projectId: project.id,
        projectName: project.name,
        month: String(month),
        year: String(year),
        fileName,
        generatedAt: now(),
        generatedBy: user.email,
        sentAt: now(),
        emailStatus: emailStatusVal,
        status: statusVal,
      });
    }

    if (!emailSuccess) {
      return NextResponse.json({ error: 'Failed to dispatch email to client.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Report emailed successfully to ${clientEmail}`,
      reportId,
    });
  } catch (err: any) {
    console.error('Error emailing monthly report:', err);
    return NextResponse.json({ error: 'Failed to process report email.' }, { status: 500 });
  }
}
