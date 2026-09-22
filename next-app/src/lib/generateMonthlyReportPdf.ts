import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Project, MonthlyReport } from '@/types/schema';

export interface MonthlyReportData {
  reportId: string;
  clientName: string;
  clientCompany?: string;
  clientEmail: string;
  projectId: string;
  projectName: string;
  projectTier?: string;
  month: string;
  year: string;
  currentStage: string;
  startingProgress: number;
  endingProgress: number;
  expectedDelivery?: string;
  workCompleted: Array<{
    date: string;
    stage: string;
    activity: string;
    responsible: string;
    remarks?: string;
  }>;
  pendingWork: string[];
  nextSteps: string[];
  communications?: Array<{
    date: string;
    sender: string;
    summary: string;
  }>;
}

const STAGES = [
  'Requirement',
  'Planning',
  'UI Design',
  'Development',
  'Testing',
  'Deployment',
  'Support',
];

export async function generateMonthlyReportPdf(data: MonthlyReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595.28, 841.89]); // A4 standard
  const { width, height } = page.getSize();

  // Color palette
  const darkNavy = rgb(0.06, 0.09, 0.16); // #0f172a
  const cardBg = rgb(0.96, 0.97, 0.99); // #f8fafc
  const textDark = rgb(0.12, 0.16, 0.23); // #1e293b
  const textMuted = rgb(0.45, 0.52, 0.62); // #718096
  const brandBlue = rgb(0.23, 0.51, 0.96); // #3b82f6
  const emeraldGreen = rgb(0.06, 0.73, 0.49); // #10b981
  const borderGrey = rgb(0.85, 0.88, 0.92);

  // Top Header Banner
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: darkNavy,
  });

  // Brand Name
  page.drawText('WEBSITE BUILDERS', {
    x: 40,
    y: height - 42,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('Enterprise Web Engineering & Client Portal Services', {
    x: 40,
    y: height - 58,
    size: 10,
    font: fontRegular,
    color: rgb(0.7, 0.78, 0.9),
  });

  // Report Title Badge (Right Side)
  page.drawText('MONTHLY PROJECT REPORT', {
    x: width - 240,
    y: height - 42,
    size: 12,
    font: fontBold,
    color: brandBlue,
  });

  page.drawText(`Period: ${data.month} ${data.year}  |  ID: ${data.reportId}`, {
    x: width - 240,
    y: height - 58,
    size: 9,
    font: fontRegular,
    color: rgb(0.7, 0.78, 0.9),
  });

  let currentY = height - 125;

  // Client & Project Information Box
  page.drawRectangle({
    x: 40,
    y: currentY - 65,
    width: width - 80,
    height: 75,
    color: cardBg,
    borderColor: borderGrey,
    borderWidth: 1,
  });

  // Left column: Client Info
  page.drawText('CLIENT INFORMATION', {
    x: 55,
    y: currentY - 12,
    size: 8,
    font: fontBold,
    color: textMuted,
  });
  page.drawText(data.clientName, {
    x: 55,
    y: currentY - 26,
    size: 11,
    font: fontBold,
    color: textDark,
  });
  page.drawText(`${data.clientCompany || 'Direct Client'} • ${data.clientEmail}`, {
    x: 55,
    y: currentY - 40,
    size: 9,
    font: fontRegular,
    color: textMuted,
  });

  // Right column: Project Info
  page.drawText('PROJECT DETAILS', {
    x: 320,
    y: currentY - 12,
    size: 8,
    font: fontBold,
    color: textMuted,
  });
  page.drawText(`${data.projectName} (${data.projectId})`, {
    x: 320,
    y: currentY - 26,
    size: 11,
    font: fontBold,
    color: textDark,
  });
  page.drawText(`Tier: ${data.projectTier || 'Professional'} • Expected Launch: ${data.expectedDelivery || 'Scheduled'}`, {
    x: 320,
    y: currentY - 40,
    size: 9,
    font: fontRegular,
    color: textMuted,
  });

  currentY -= 85;

  // KPI Metrics Row (4 Columns)
  const metricWidth = (width - 80 - 30) / 4;
  const progressDelta = data.endingProgress - data.startingProgress;

  const metrics = [
    { label: 'STARTING PROGRESS', val: `${data.startingProgress}%`, color: textDark },
    { label: 'ENDING PROGRESS', val: `${data.endingProgress}%`, color: brandBlue },
    { label: 'PROGRESS DELTA', val: `${progressDelta >= 0 ? '+' : ''}${progressDelta}%`, color: emeraldGreen },
    { label: 'CURRENT STAGE', val: data.currentStage, color: textDark },
  ];

  metrics.forEach((m, idx) => {
    const mx = 40 + idx * (metricWidth + 10);
    page.drawRectangle({
      x: mx,
      y: currentY - 45,
      width: metricWidth,
      height: 45,
      color: cardBg,
      borderColor: borderGrey,
      borderWidth: 1,
    });
    page.drawText(m.label, {
      x: mx + 10,
      y: currentY - 15,
      size: 7,
      font: fontBold,
      color: textMuted,
    });
    page.drawText(m.val, {
      x: mx + 10,
      y: currentY - 34,
      size: 13,
      font: fontBold,
      color: m.color,
    });
  });

  currentY -= 65;

  // Visual 7-Stage Timeline Pipeline Diagram
  page.drawText('PROJECT LIFECYCLE TIMELINE', {
    x: 40,
    y: currentY,
    size: 10,
    font: fontBold,
    color: textDark,
  });
  currentY -= 15;

  const currentStageIndex = STAGES.findIndex(
    (s) => s.toLowerCase() === data.currentStage.toLowerCase()
  );
  const stepWidth = (width - 80) / STAGES.length;

  STAGES.forEach((stageName, idx) => {
    const sx = 40 + idx * stepWidth;
    const isCompleted = idx < currentStageIndex;
    const isCurrent = idx === currentStageIndex;

    const stepColor = isCompleted
      ? emeraldGreen
      : isCurrent
      ? brandBlue
      : borderGrey;

    page.drawRectangle({
      x: sx + 2,
      y: currentY - 18,
      width: stepWidth - 4,
      height: 20,
      color: stepColor,
    });

    page.drawText(stageName, {
      x: sx + 4,
      y: currentY - 13,
      size: 7,
      font: fontBold,
      color: isCompleted || isCurrent ? rgb(1, 1, 1) : textMuted,
    });
  });

  currentY -= 35;

  // Work Completed Section
  page.drawText('WORK COMPLETED DURING THIS PERIOD', {
    x: 40,
    y: currentY,
    size: 10,
    font: fontBold,
    color: textDark,
  });
  currentY -= 15;

  // Table Header
  page.drawRectangle({
    x: 40,
    y: currentY - 16,
    width: width - 80,
    height: 18,
    color: darkNavy,
  });
  page.drawText('DATE', { x: 48, y: currentY - 12, size: 7, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('STAGE', { x: 110, y: currentY - 12, size: 7, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('ACTIVITY / DELIVERABLE', { x: 190, y: currentY - 12, size: 7, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('RESPONSIBLE', { x: 450, y: currentY - 12, size: 7, font: fontBold, color: rgb(1, 1, 1) });

  currentY -= 20;

  const updates = data.workCompleted.length > 0 ? data.workCompleted.slice(0, 7) : [
    {
      date: `${data.month} 2026`,
      stage: data.currentStage,
      activity: 'Active milestones progression, code quality testing, and deliverable review.',
      responsible: 'Project Engineering Team',
    },
  ];

  updates.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? rgb(1, 1, 1) : cardBg;
    page.drawRectangle({
      x: 40,
      y: currentY - 16,
      width: width - 80,
      height: 18,
      color: rowBg,
      borderColor: borderGrey,
      borderWidth: 0.5,
    });

    page.drawText(item.date.slice(0, 10), { x: 48, y: currentY - 12, size: 8, font: fontRegular, color: textDark });
    page.drawText(item.stage.slice(0, 15), { x: 110, y: currentY - 12, size: 8, font: fontBold, color: brandBlue });
    page.drawText(item.activity.slice(0, 52), { x: 190, y: currentY - 12, size: 8, font: fontRegular, color: textDark });
    page.drawText(item.responsible.slice(0, 20), { x: 450, y: currentY - 12, size: 8, font: fontRegular, color: textMuted });

    currentY -= 18;
  });

  currentY -= 15;

  // Pending Work & Next Steps Split Box
  const colWidth = (width - 80 - 15) / 2;

  // Left: Pending Work
  page.drawRectangle({
    x: 40,
    y: currentY - 80,
    width: colWidth,
    height: 85,
    color: cardBg,
    borderColor: borderGrey,
    borderWidth: 1,
  });
  page.drawText('PENDING WORK & VALIDATION', {
    x: 52,
    y: currentY - 12,
    size: 8,
    font: fontBold,
    color: textDark,
  });
  const pending = data.pendingWork.length > 0
    ? data.pendingWork.slice(0, 3)
    : ['End-to-end integration tests', 'Performance & SEO audit', 'Client sign-off on staging'];
  pending.forEach((item, i) => {
    page.drawText(`•  ${item.slice(0, 42)}`, {
      x: 52,
      y: currentY - 28 - i * 16,
      size: 8,
      font: fontRegular,
      color: textMuted,
    });
  });

  // Right: Next Steps
  page.drawRectangle({
    x: 40 + colWidth + 15,
    y: currentY - 80,
    width: colWidth,
    height: 85,
    color: cardBg,
    borderColor: borderGrey,
    borderWidth: 1,
  });
  page.drawText('PLANNED NEXT STEPS', {
    x: 55 + colWidth + 15,
    y: currentY - 12,
    size: 8,
    font: fontBold,
    color: textDark,
  });
  const steps = data.nextSteps.length > 0
    ? data.nextSteps.slice(0, 3)
    : ['Production DNS configuration', 'SSL enforcement verification', 'Staff training & documentation'];
  steps.forEach((item, i) => {
    page.drawText(`•  ${item.slice(0, 42)}`, {
      x: 55 + colWidth + 15,
      y: currentY - 28 - i * 16,
      size: 8,
      font: fontRegular,
      color: textMuted,
    });
  });

  // Footer
  page.drawLine({
    start: { x: 40, y: 55 },
    end: { x: width - 40, y: 55 },
    thickness: 1,
    color: borderGrey,
  });

  page.drawText('This is a verified computer-generated monthly progress report created by Website Builders.', {
    x: 40,
    y: 40,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });

  page.drawText('websitebuildeers@gmail.com  •  https://website-builders-wine.vercel.app', {
    x: width - 340,
    y: 40,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });

  return await doc.save();
}
