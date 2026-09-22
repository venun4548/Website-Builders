import {
  SHEETS,
  appendRow,
  findRow,
  updateRow,
  deleteRow,
  generateId,
  now,
} from '../lib/sheets';
import { generateMonthlyReportPdf, MonthlyReportData } from '../lib/generateMonthlyReportPdf';
import {
  generateTotpSetup,
  verifyTotpToken,
  encryptSecret,
  decryptSecret,
} from '../lib/totp';
import {
  processInvoiceReminders,
  processLeadFollowups,
  processDeadlineAlerts,
  processAbandonedFollowups,
} from '../lib/automation';
import en from '../locales/en.json';
import te from '../locales/te.json';
import hi from '../locales/hi.json';
import {
  MonthlyReport,
  PushSubscriptionRecord,
  EmailLog,
  RevisionRequest,
  RevisionAnnotation,
  SatisfactionSurvey,
  MaintenanceRequest,
  WebsiteSetting,
} from '../types/schema';

async function runAdvancedFeaturesSuite() {
  console.log('===============================================================');
  console.log('=== WEBSITE BUILDERS: ADVANCED FEATURES COMPREHENSIVE SUITE ===');
  console.log('===============================================================\n');

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

  // -------------------------------------------------------------
  // TEST 1: Google Sheets Schema Registration
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Google Sheets New Schemas ---');
  const requiredSheets = [
    'PushSubscriptions',
    'MonthlyReports',
    'EmailLogs',
    'InvoiceReminderLogs',
    'LeadFollowUpLogs',
    'DeadlineAlertLogs',
    'AbandonedContacts',
    'RevisionRequests',
    'RevisionAnnotations',
    'SatisfactionSurveys',
    'MaintenanceRequests',
    'WebsiteSettings',
  ] as const;

  requiredSheets.forEach((s) => {
    assert(s in SHEETS, `Schema registered for '${s}'`);
  });

  // -------------------------------------------------------------
  // TEST 2: Google Sheets CRUD on New Entities
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Database Operations on New Tables ---');
  const testSubId = `PS-TEST-${Date.now()}`;
  await appendRow<PushSubscriptionRecord>('PushSubscriptions', {
    id: testSubId,
    userId: 'user_test_01',
    role: 'client',
    email: 'client@example.com',
    endpoint: 'https://fcm.googleapis.com/fcm/send/test-sub-1',
    p256dh: 'test-p256dh-key',
    auth: 'test-auth-key',
    createdAt: now(),
    active: 'true',
  });

  const foundSub = await findRow<PushSubscriptionRecord>(
    'PushSubscriptions',
    (s) => s.id === testSubId
  );
  assert(Boolean(foundSub && foundSub.email === 'client@example.com'), 'PushSubscription created and retrieved');

  const updatedSub = await updateRow<PushSubscriptionRecord>(
    'PushSubscriptions',
    testSubId,
    { active: 'false' }
  );
  assert(Boolean(updatedSub && updatedSub.active === 'false'), 'PushSubscription soft-updated');

  // Test Revision Requests & Annotations
  const testRevId = `REV-TEST-${Date.now()}`;
  await appendRow<RevisionRequest>('RevisionRequests', {
    id: testRevId,
    projectId: 'proj_test_01',
    clientId: 'user_test_01',
    clientName: 'Test Client',
    clientEmail: 'client@example.com',
    description: 'Change hero header color to dark navy',
    priority: 'High',
    status: 'Open',
    createdAt: now(),
    updatedAt: now(),
  });

  const foundRev = await findRow<RevisionRequest>('RevisionRequests', (r) => r.id === testRevId);
  assert(Boolean(foundRev && foundRev.priority === 'High' && foundRev.clientEmail === 'client@example.com'), 'RevisionRequest created with clientEmail and queried');

  // Test Maintenance Requests
  const testMntId = `MNT-TEST-${Date.now()}`;
  await appendRow<MaintenanceRequest>('MaintenanceRequests', {
    id: testMntId,
    projectId: 'proj_test_01',
    clientId: 'user_test_01',
    clientName: 'Test Client',
    clientEmail: 'client@example.com',
    title: 'Update contact phone number',
    description: 'Change phone number to +91 7386204885',
    category: 'Content Update',
    priority: 'Medium',
    status: 'Submitted',
    createdAt: now(),
    updatedAt: now(),
  });

  const foundMnt = await findRow<MaintenanceRequest>('MaintenanceRequests', (m) => m.id === testMntId);
  assert(Boolean(foundMnt && foundMnt.category === 'Content Update'), 'MaintenanceRequest created and queried');

  // -------------------------------------------------------------
  // TEST 3: Real Server-Side Binary PDF Generation (Part 58)
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Real Server-Side Binary PDF Generation ---');
  const sampleReportData: MonthlyReportData = {
    reportId: 'MR-2026-SEP-001',
    clientName: 'Acme Global Corp',
    clientCompany: 'Acme International',
    clientEmail: 'acme@example.com',
    projectId: 'WB-2026-001',
    projectName: 'Enterprise Web Portal',
    projectTier: 'Enterprise',
    month: 'September',
    year: '2026',
    currentStage: 'Development',
    startingProgress: 40,
    endingProgress: 75,
    expectedDelivery: '2026-10-15',
    workCompleted: [
      {
        date: '2026-09-05',
        stage: 'Development',
        activity: 'Integrated Google Sheets API v4 database schema and auth layers',
        responsible: 'Senior Full-Stack Engineer',
      },
      {
        date: '2026-09-15',
        stage: 'UI Design',
        activity: 'Completed visual revisions for responsive mobile navigation',
        responsible: 'Lead Designer',
      },
    ],
    pendingWork: ['Automated regression tests', 'Production deployment verification'],
    nextSteps: ['Handover client training documentation', 'Launch event scheduled'],
  };

  const pdfBuffer = await generateMonthlyReportPdf(sampleReportData);
  assert(pdfBuffer instanceof Uint8Array, 'PDF output is a genuine Uint8Array binary');
  assert(pdfBuffer.length > 2000, `PDF size is realistic and non-empty (${pdfBuffer.length} bytes)`);

  // Verify %PDF-1.7 header magic bytes
  const pdfHeader = Buffer.from(pdfBuffer.slice(0, 8)).toString('ascii');
  assert(pdfHeader.startsWith('%PDF-'), `PDF starts with standard PDF magic bytes (Header: ${pdfHeader.trim()})`);

  // Verify EOF trailer
  const pdfTail = Buffer.from(pdfBuffer.slice(-20)).toString('ascii');
  assert(pdfTail.includes('%%EOF'), 'PDF contains standard EOF termination marker');

  // -------------------------------------------------------------
  // TEST 4: Admin TOTP 2FA Verification & Encryption (Parts 8 & 9)
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Admin TOTP 2FA & Secret Protection ---');
  const email = 'admin@websitebuilders.com';
  const setup = await generateTotpSetup(email);

  assert(Boolean(setup.secret && setup.secret.length >= 16), 'Generated RFC 6238 base32 secret');
  assert(Boolean(setup.qrCodeUrl && setup.qrCodeUrl.startsWith('data:image/png;base64,')), 'Generated QR code Data URI');

  // Test Secret Encryption
  const encrypted = encryptSecret(setup.secret);
  assert(encrypted !== setup.secret, 'Secret is properly encrypted and not plain text');
  assert(encrypted.split(':').length === 3, 'AES-256-GCM format includes IV, auth tag, and ciphertext');

  const decrypted = decryptSecret(encrypted);
  assert(decrypted === setup.secret, 'Secret cleanly decrypts back to original key');

  // Test Code Verification
  const { generateSync } = await import('otplib');
  const validToken = generateSync({ secret: setup.secret });
  const isTokenValid = verifyTotpToken(validToken, setup.secret);
  assert(isTokenValid, 'Valid 6-digit TOTP code passes verification');

  const isInvalidTokenValid = verifyTotpToken('000000', setup.secret);
  assert(!isInvalidTokenValid, 'Invalid TOTP code is rejected');

  // -------------------------------------------------------------
  // TEST 5: Scheduled Automation & Idempotency (Parts 15-25, 37, 49)
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Automated Scheduled Jobs & Idempotency ---');
  const invoiceJob1 = await processInvoiceReminders();
  assert(typeof invoiceJob1.processed === 'number', 'Invoice reminder job ran without errors');

  // Running second time must be idempotent
  const invoiceJob2 = await processInvoiceReminders();
  assert(invoiceJob2.sent === 0 || invoiceJob2.skipped >= invoiceJob1.skipped, 'Invoice reminder job is idempotent (no duplicates)');

  const leadJob = await processLeadFollowups();
  assert(typeof leadJob.processed === 'number', 'Lead follow-up job executed successfully');

  const deadlineJob = await processDeadlineAlerts();
  assert(typeof deadlineJob.processed === 'number', 'Deadline alert job executed successfully');

  const abandonedJob = await processAbandonedFollowups();
  assert(typeof abandonedJob.processed === 'number', 'Abandoned contact recovery job executed successfully');

  // -------------------------------------------------------------
  // TEST 6: Multi-Language Dictionary Integrity (Part 6)
  // -------------------------------------------------------------
  console.log('\n--- 6. Testing Multi-Language Dictionaries (EN, TE, HI) ---');
  const enSections = Object.keys(en);
  const teSections = Object.keys(te);
  const hiSections = Object.keys(hi);

  assert(enSections.length >= 6, `English dictionary loaded with ${enSections.length} sections`);
  assert(teSections.length === enSections.length, 'Telugu dictionary has matching sections with English');
  assert(hiSections.length === enSections.length, 'Hindi dictionary has matching sections with English');

  // Spot-check important keys
  assert(en.nav.home === 'Home', 'English home navigation string correct');
  assert(te.nav.home === 'హోమ్', 'Telugu home navigation string correct');
  assert(hi.nav.home === 'होम', 'Hindi home navigation string correct');

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdvancedFeaturesSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
