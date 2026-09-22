import { getActiveRows, findRows, appendRow, updateRow, generateId, now } from '@/lib/sheets';
import { generateMonthlyReportPdf, MonthlyReportData } from '@/lib/generateMonthlyReportPdf';
import { sendEmail } from '@/lib/emailSender';
import { Project, MonthlyReport, StageHistory, User } from '@/types/schema';

export async function processMonthlyReportsCron(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
}> {
  const [projects, existingReports, users, stageHistories] = await Promise.all([
    getActiveRows<Project>('Projects'),
    getActiveRows<MonthlyReport>('MonthlyReports'),
    getActiveRows<User>('Users'),
    getActiveRows<StageHistory>('StageHistory'),
  ]);

  // Determine previous month name and year
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - 1);
  const monthName = date.toLocaleString('default', { month: 'long' });
  const yearStr = String(date.getFullYear());

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const proj of projects) {
    processed++;
    if (!proj.clientEmail) {
      skipped++;
      continue;
    }

    // Idempotency: Prevent duplicates if report already sent or generated for this month/year
    const alreadyExists = existingReports.some(
      (r) =>
        r.projectId === proj.id &&
        r.month.toLowerCase() === monthName.toLowerCase() &&
        String(r.year) === yearStr &&
        (r.status === 'Sent' || r.status === 'Generated')
    );

    if (alreadyExists) {
      skipped++;
      continue;
    }

    const clientUser = users.find((u) => u.id === proj.clientId);
    const clientName = clientUser?.name || proj.clientName || 'Valued Client';
    const clientEmail = clientUser?.email || proj.clientEmail;

    const projHistory = stageHistories.filter((s) => s.projectId === proj.id);
    const workCompleted = projHistory.map((s) => ({
      date: s.timestamp ? s.timestamp.slice(0, 10) : now().slice(0, 10),
      stage: s.stage,
      activity: s.notes || `Milestone reached: ${s.stage}`,
      responsible: s.changedBy || 'Engineering Team',
    }));

    const reportId = `MR-${yearStr}-${monthName.slice(0, 3).toUpperCase()}-${generateId().slice(0, 4)}`;
    const fileName = `Report-${proj.id}-${monthName}-${yearStr}.pdf`;

    const reportData: MonthlyReportData = {
      reportId,
      clientName,
      clientCompany: clientUser?.company,
      clientEmail,
      projectId: proj.id,
      projectName: proj.name,
      projectTier: proj.tier,
      month: monthName,
      year: yearStr,
      currentStage: proj.stage || 'Development',
      startingProgress: Math.max(0, (proj.progress || 0) - 20),
      endingProgress: proj.progress || 0,
      expectedDelivery: proj.estimatedLaunch,
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

    try {
      const pdfBytes = await generateMonthlyReportPdf(reportData);

      const emailSubject = `Your ${monthName} ${yearStr} Project Report — Website Builders`;
      const emailHtml = `
        <div style="font-family: sans-serif; color: #1e293b; max-width: 600px;">
          <h2 style="color: #0f172a;">Your Monthly Project Report is Ready</h2>
          <p>Dear ${clientName},</p>
          <p>We are pleased to provide your comprehensive progress report for <strong>${proj.name}</strong> for the period of <strong>${monthName} ${yearStr}</strong>.</p>
          <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0;">
            <strong>Current Stage:</strong> ${proj.stage}<br>
            <strong>Current Progress:</strong> ${proj.progress}%<br>
            <strong>Expected Launch:</strong> ${proj.estimatedLaunch || 'On Schedule'}
          </div>
          <p>Please find the official verified PDF report attached to this email for your records.</p>
          <p style="font-size: 12px; color: #64748b; margin-top: 30px;">Website Builders Engineering Team • websitebuildeers@gmail.com</p>
        </div>
      `;

      const emailSuccess = await sendEmail({
        to: clientEmail,
        recipientName: clientName,
        subject: emailSubject,
        html: emailHtml,
        type: 'monthly_report',
        relatedId: proj.id,
        attachments: [
          {
            filename: fileName,
            content: Buffer.from(pdfBytes),
            contentType: 'application/pdf',
          },
        ],
      });

      const statusVal = emailSuccess ? 'Sent' : 'Failed';
      if (emailSuccess) sent++;
      else failed++;

      await appendRow<MonthlyReport>('MonthlyReports', {
        id: reportId,
        clientId: proj.clientId,
        clientName,
        clientEmail,
        projectId: proj.id,
        projectName: proj.name,
        month: monthName,
        year: yearStr,
        fileName,
        generatedAt: now(),
        generatedBy: 'system-cron',
        sentAt: now(),
        emailStatus: statusVal,
        status: statusVal,
      });
    } catch (err) {
      console.error(`Error processing monthly report for project ${proj.id}:`, err);
      failed++;
    }
  }

  return { processed, sent, skipped, failed };
}
