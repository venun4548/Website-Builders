import {
  SHEETS,
  getRows,
  getActiveRows,
  findRow,
  appendRow,
  updateRow,
  deleteRow,
  generateId,
  now,
} from '../lib/sheets';
import { getNextInvoiceNumber } from '../lib/invoiceNumber';
import { getNextTicketNumber } from '../lib/ticketNumber';
import { sendNotification } from '../lib/notify';
import { auditLog } from '../lib/auditLog';
import { generateInvoiceHtml } from '../lib/generateInvoicePdf';
import {
  templateEmailVerification,
  templateInvoiceCreated,
  templateStageChange,
  templateContactAcknowledgment,
} from '../lib/emails/templates';

async function runTests() {
  console.log('=== STARTING GOOGLE SHEETS FULL PORTAL E2E TESTS ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Verify all Google Sheets tabs are registered
  const tabNames = Object.keys(SHEETS);
  assert(tabNames.length >= 30, `All Google Sheets tabs defined (found ${tabNames.length})`);
  assert(tabNames.includes('Users'), 'Users tab exists');
  assert(tabNames.includes('Projects'), 'Projects tab exists');
  assert(tabNames.includes('StageHistory'), 'StageHistory tab exists');
  assert(tabNames.includes('Invoices'), 'Invoices tab exists');
  assert(tabNames.includes('InvoiceItems'), 'InvoiceItems tab exists');
  assert(tabNames.includes('Files'), 'Files tab exists');
  assert(tabNames.includes('Tasks'), 'Tasks tab exists');
  assert(tabNames.includes('Tickets'), 'Tickets tab exists');
  assert(tabNames.includes('TicketMessages'), 'TicketMessages tab exists');
  assert(tabNames.includes('Leads'), 'Leads tab exists');
  assert(tabNames.includes('LeadNotes'), 'LeadNotes tab exists');
  assert(tabNames.includes('Portfolio'), 'Portfolio tab exists');
  assert(tabNames.includes('Pricing'), 'Pricing tab exists');
  assert(tabNames.includes('Notifications'), 'Notifications tab exists');
  assert(tabNames.includes('AuditLog'), 'AuditLog tab exists');
  assert(tabNames.includes('PasswordResets'), 'PasswordResets tab exists');
  assert(tabNames.includes('EmailVerifications'), 'EmailVerifications tab exists');
  assert(tabNames.includes('ContactSubmissions'), 'ContactSubmissions tab exists');
  assert(tabNames.includes('BrandInfo'), 'BrandInfo tab exists');
  assert(tabNames.includes('PushSubscriptions'), 'PushSubscriptions tab exists');
  assert(tabNames.includes('MonthlyReports'), 'MonthlyReports tab exists');
  assert(tabNames.includes('EmailLogs'), 'EmailLogs tab exists');
  assert(tabNames.includes('InvoiceReminderLogs'), 'InvoiceReminderLogs tab exists');
  assert(tabNames.includes('LeadFollowUpLogs'), 'LeadFollowUpLogs tab exists');
  assert(tabNames.includes('DeadlineAlertLogs'), 'DeadlineAlertLogs tab exists');
  assert(tabNames.includes('AbandonedContacts'), 'AbandonedContacts tab exists');
  assert(tabNames.includes('RevisionRequests'), 'RevisionRequests tab exists');
  assert(tabNames.includes('RevisionAnnotations'), 'RevisionAnnotations tab exists');
  assert(tabNames.includes('SatisfactionSurveys'), 'SatisfactionSurveys tab exists');
  assert(tabNames.includes('MaintenanceRequests'), 'MaintenanceRequests tab exists');
  assert(tabNames.includes('WebsiteSettings'), 'WebsiteSettings tab exists');

  // 2. Test User creation & lookup
  const testUserId = generateId();
  const testEmail = `client_${Date.now()}@example.com`;
  await appendRow('Users', {
    id: testUserId,
    email: testEmail,
    passwordHash: 'hash123',
    name: 'Jane Doe',
    company: 'Doe Enterprises',
    role: 'client',
    isEmailVerified: 'false',
    onboardingComplete: 'false',
    createdAt: now(),
    updatedAt: now(),
  });

  const foundUser = await findRow('Users', (u: any) => u.id === testUserId);
  assert(foundUser !== null && foundUser.email === testEmail, 'User appended and queried from Users tab');

  // Verify email update
  await updateRow('Users', testUserId, { isEmailVerified: 'true' });
  const verifiedUser = await findRow('Users', (u: any) => u.id === testUserId);
  assert(verifiedUser?.isEmailVerified === 'true', 'User email verification status updated');

  // 3. Test Project Progress Tracker (6 stages)
  const testProjectId = generateId();
  await appendRow('Projects', {
    id: testProjectId,
    clientId: testUserId,
    clientName: 'Jane Doe',
    clientEmail: testEmail,
    name: 'Doe Ecommerce Store',
    tier: 'Professional',
    stage: 'Discovery',
    progress: 0,
    assignedStaff: '[]',
    estimatedLaunch: '2026-10-01',
    createdAt: now(),
    updatedAt: now(),
  });

  const foundProj = await findRow('Projects', (p: any) => p.id === testProjectId);
  assert(foundProj !== null && foundProj.stage === 'Discovery', 'Project initialized in Discovery stage');

  // Advance stage to Development (40%)
  await updateRow('Projects', testProjectId, { stage: 'Development', progress: 40 });
  await appendRow('StageHistory', {
    id: generateId(),
    projectId: testProjectId,
    clientName: 'Jane Doe',
    clientEmail: testEmail,
    stage: 'Development',
    changedBy: 'admin@websitebuilders.com',
    notes: 'Frontend and backend sprint initiated',
    timestamp: now(),
  });

  const updatedProj = await findRow('Projects', (p: any) => p.id === testProjectId);
  assert(updatedProj?.stage === 'Development' && Number(updatedProj.progress) === 40, 'Project stage advanced to Development (40%)');

  // 4. Test Sequential Invoice Generation & 18% GST calculation
  const nextInv = await getNextInvoiceNumber();
  assert(nextInv.startsWith('INV-2026-'), `Sequential invoice number generated: ${nextInv}`);

  const subtotal = 20000;
  const gstAmount = subtotal * 0.18; // 3600
  const totalAmount = subtotal + gstAmount; // 23600

  await appendRow('Invoices', {
    id: nextInv,
    projectId: testProjectId,
    projectName: 'Doe Ecommerce Store',
    clientId: testUserId,
    clientName: 'Jane Doe',
    clientEmail: testEmail,
    amount: subtotal,
    gstAmount,
    totalAmount,
    status: 'Draft',
    dueDate: '2026-10-15',
    createdAt: now(),
    updatedAt: now(),
  });

  const foundInv = await findRow('Invoices', (i: any) => i.id === nextInv);
  assert(foundInv !== null && Number(foundInv.totalAmount) === 23600, 'Invoice stored with exact 18% GST calculation (₹23,600)');

  // Test Invoice HTML generation
  const invoiceHtml = generateInvoiceHtml(foundInv, [
    { id: '1', invoiceId: nextInv, description: 'Development Phase', quantity: 1, rate: 20000, amount: 20000 },
  ]);
  assert(invoiceHtml.includes('TAX INVOICE') && invoiceHtml.includes(nextInv), 'Tax invoice HTML generated successfully');

  // 5. Test File Sharing (Deliverables vs Assets)
  const testFileId = generateId();
  await appendRow('Files', {
    id: testFileId,
    projectId: testProjectId,
    clientName: 'Jane Doe',
    clientEmail: testEmail,
    uploadedBy: 'staff@websitebuilders.com',
    fileName: 'Final_Design_System.pdf',
    fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
    fileSize: '3.4 MB',
    fileType: 'application/pdf',
    category: 'Deliverable',
    uploadedAt: now(),
  });

  const foundFile = await findRow('Files', (f: any) => f.id === testFileId);
  assert(foundFile !== null && foundFile.category === 'Deliverable' && foundFile.clientEmail === testEmail, 'Project deliverable file registered in Files tab with clientEmail');

  // 6. Test Sequential Support Ticket Generation (TKT-XXXX) & Messages
  const nextTkt = await getNextTicketNumber();
  assert(nextTkt.startsWith('TKT-'), `Sequential ticket number generated: ${nextTkt}`);

  await appendRow('Tickets', {
    id: nextTkt,
    clientId: testUserId,
    clientName: 'Jane Doe',
    clientEmail: testEmail,
    subject: 'DNS Configuration Assistance',
    priority: 'High',
    status: 'Open',
    assignedTo: 'staff@websitebuilders.com',
    createdAt: now(),
    updatedAt: now(),
  });

  await appendRow('TicketMessages', {
    id: generateId(),
    ticketId: nextTkt,
    senderEmail: testEmail,
    senderRole: 'client',
    message: 'We need help setting up our apex domain DNS records.',
    timestamp: now(),
  });

  const foundTkt = await findRow('Tickets', (t: any) => t.id === nextTkt);
  assert(foundTkt !== null && foundTkt.priority === 'High', 'Ticket logged with high priority in Tickets tab');

  // 7. Test CRM Leads & Pipeline
  const testLeadId = generateId();
  await appendRow('Leads', {
    id: testLeadId,
    name: 'Mark Taylor',
    email: 'mark@taylorcorp.com',
    phone: '+91 9988776655',
    service: 'Enterprise SaaS',
    budget: '₹50,000+',
    message: 'Need high-throughput API gateway and dashboard.',
    status: 'New',
    assignedTo: '',
    convertedProjectId: '',
    createdAt: now(),
    updatedAt: now(),
  });

  const foundLead = await findRow('Leads', (l: any) => l.id === testLeadId);
  assert(foundLead !== null && foundLead.status === 'New', 'Inbound contact inquiry created CRM lead');

  // Add note to lead
  await appendRow('LeadNotes', {
    id: generateId(),
    leadId: testLeadId,
    authorEmail: 'sales@websitebuilders.com',
    note: 'Initial discovery call scheduled for tomorrow 11 AM.',
    timestamp: now(),
  });

  const foundLeadNote = await findRow('LeadNotes', (n: any) => n.leadId === testLeadId);
  assert(foundLeadNote !== null && foundLeadNote.note.includes('Initial discovery call'), 'Internal note added to lead record');

  // Convert lead to Won
  await updateRow('Leads', testLeadId, { status: 'Won', convertedProjectId: 'proj_converted_99' });
  const wonLead = await findRow('Leads', (l: any) => l.id === testLeadId);
  assert(wonLead?.status === 'Won' && wonLead.convertedProjectId === 'proj_converted_99', 'Lead converted to project and marked Won');

  // 8. Test Notifications System
  const notif = await sendNotification(testUserId, 'stage_change', 'Milestone Reached', 'Your project moved to Development', '/user/projects');
  assert(notif !== null && notif.userId === testUserId, 'Notification logged in Notifications tab');

  // 9. Test Audit Log
  const auditEntry = await auditLog({
    actorEmail: 'admin@websitebuilders.com',
    actorRole: 'superadmin',
    action: 'TEST_VERIFICATION',
    resourceType: 'project',
    resourceId: testProjectId,
    resourceName: 'Doe Ecommerce Store',
    details: { passed: true },
  });
  assert(auditEntry !== null && auditEntry.action === 'TEST_VERIFICATION', 'Admin action recorded in AuditLog tab');

  // 10. Test Email Templates
  const emailVerif = templateEmailVerification('Jane Doe', 'tok_123');
  assert(emailVerif.subject.includes('Verify your Website Builders account'), 'Email verification template formatted');
  assert(emailVerif.html.includes('websitebuilders@gmail.com'), 'Email template has correct brand contact email');

  const invoiceEmail = templateInvoiceCreated('Jane Doe', nextInv, totalAmount, '2026-10-15');
  assert(invoiceEmail.subject.includes(nextInv), 'Invoice email template includes invoice ID');

  console.log(`\n=== E2E TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
