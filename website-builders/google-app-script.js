/**
 * ============================================================
 * Website Builders – Enterprise Apps Script Backend
 * ============================================================
 */

const CONFIG = {
  SPREADSHEET_ID  : '1BbDho5uGScPbuDxL2nWaNFpwESUsb6CWcY9vJkeYuUk',
  SHEET_NAME      : 'Sheet1',
  BUSINESS_NAME   : 'Website Builders',
  BUSINESS_EMAIL  : 'venun4548@gmail.com', // Recipient for owner notifications
  BUSINESS_PHONE  : '+91 7386204885',
  BUSINESS_ADDRESS: 'Tirupathi, Balaji Colony, 517502',
  BUSINESS_WEBSITE: 'https://websitebuilders.com',
  DELAY_MINUTES   : 5,
  SHARED_SECRET   : 'sec_wb_crm_77c4e569bbd18f0a1c6a58' // Shared secret for Flask-to-GAS auth
};

// ──────────────────────────────────────────────────────────────
// TEST FUNCTION – Run this from the editor to verify setup
// ──────────────────────────────────────────────────────────────
function testScript() {
  Logger.log('=== Testing Website Builders Contact Form Script ===');

  // 1. Test Sheet connection
  try {
    const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];
    Logger.log('✅ Sheet connected: "' + sheet.getName() + '" — ' + sheet.getLastRow() + ' rows');
  } catch(err) {
    Logger.log('❌ Sheet connection failed: ' + err.toString());
    return;
  }

  // 2. Test email sending
  try {
    const testHtml = buildEmailTemplate('Test User', 'WB-TEST-0001', 'This is a test submission.');
    GmailApp.sendEmail(
      CONFIG.BUSINESS_EMAIL,
      '[TEST] Website Builders Script Working ✅',
      'This is a test email to confirm the script is working correctly.',
      { htmlBody: testHtml, name: CONFIG.BUSINESS_NAME }
    );
    Logger.log('✅ Test email sent to: ' + CONFIG.BUSINESS_EMAIL);
  } catch(err) {
    Logger.log('❌ Email send failed: ' + err.toString());
    return;
  }

  Logger.log('=== All tests passed! Script is ready. ===');
}

// Column Definitions (1-based index mapping for Google Sheets)
const COL = {
  SUBMISSION_ID   : 1,
  TIMESTAMP       : 2,
  CUSTOMER_NAME   : 3,
  EMAIL           : 4,
  MOBILE_NUMBER   : 5,
  ADDRESS         : 6,
  MESSAGE         : 7,
  EMAIL_STATUS    : 8,
  EMAIL_SENT_AT   : 9,
  OWNER_NOTIF_STAT: 10,
  OWNER_NOTIF_TIME: 11,
  TICKET_STATUS   : 12,
  ASSIGNED_TO     : 13,
  FOLLOWUP_DATE   : 14,
  FOLLOWUP_STATUS : 15,
  SOURCE_PAGE     : 16,
  REMARKS         : 17
};

function initialSetup() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  
  const headers = [
    'Submission ID', 'Timestamp', 'Customer Name', 'Email', 'Mobile Number',
    'Address', 'Message', 'Email Status', 'Email Sent At', 'Owner Notification Status',
    'Owner Notification Time', 'Ticket Status', 'Assigned To', 'Follow-up Date',
    'Follow-up Status', 'Source Page', 'Remarks'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#0f172a')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  
  Logger.log('Sheet initialized successfully.');
}

/**
 * Handle GET requests (Retrieves all enquiries for Flask Admin Dashboard)
 */
function doGet(e) {
  if (!e || !e.parameter || e.parameter.token !== CONFIG.SHARED_SECRET) {
    return jsonResponse('error', 'Unauthorized.');
  }

  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return jsonResponse('success', []);
    }

    const data = sheet.getRange(2, 1, lastRow - 1, COL.REMARKS).getValues();
    const records = data.map(row => {
      return {
        submissionId: String(row[COL.SUBMISSION_ID - 1]),
        timestamp: String(row[COL.TIMESTAMP - 1]),
        customerName: String(row[COL.CUSTOMER_NAME - 1]),
        email: String(row[COL.EMAIL - 1]),
        mobileNumber: String(row[COL.MOBILE_NUMBER - 1]),
        address: String(row[COL.ADDRESS - 1]),
        message: String(row[COL.MESSAGE - 1]),
        emailStatus: String(row[COL.EMAIL_STATUS - 1]),
        emailSentAt: String(row[COL.EMAIL_SENT_AT - 1]),
        ownerNotificationStatus: String(row[COL.OWNER_NOTIF_STAT - 1]),
        ownerNotificationTime: String(row[COL.OWNER_NOTIF_TIME - 1]),
        ticketStatus: String(row[COL.TICKET_STATUS - 1]),
        assignedTo: String(row[COL.ASSIGNED_TO - 1]),
        followUpDate: String(row[COL.FOLLOWUP_DATE - 1]),
        followUpStatus: String(row[COL.FOLLOWUP_STATUS - 1]),
        sourcePage: String(row[COL.SOURCE_PAGE - 1]),
        remarks: String(row[COL.REMARKS - 1])
      };
    });

    return jsonResponse('success', records);
  } catch (err) {
    return jsonResponse('error', err.toString());
  }
}

/**
 * Handle POST requests (Submissions from public form, and Updates from Flask backend)
 */
function doPost(e) {
  if (!e || !e.parameter) {
    return jsonResponse('error', 'Invalid request.');
  }

  const params = e.parameter;

  // Check if it's an administrative action from Flask Backend
  if (params.action && params.action === 'update_enquiry') {
    if (params.token !== CONFIG.SHARED_SECRET) {
      return jsonResponse('error', 'Unauthorized administrative request.');
    }
    return handleAdministrativeUpdate(params);
  }

  // Otherwise, it's a standard customer form submission
  return handleCustomerSubmission(params);
}

function handleAdministrativeUpdate(params) {
  const submissionId = params.submissionId;
  if (!submissionId) {
    return jsonResponse('error', 'Submission ID is required.');
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return jsonResponse('error', 'Server busy. Please try again.');
  }

  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];
    const lastRow = sheet.getLastRow();
    
    let rowIndex = -1;
    if (lastRow > 1) {
      const ids = sheet.getRange(2, COL.SUBMISSION_ID, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === submissionId) {
          rowIndex = i + 2;
          break;
        }
      }
    }

    if (rowIndex === -1) {
      lock.releaseLock();
      return jsonResponse('error', 'Record not found.');
    }

    // Apply updates if they are provided
    if (params.ticketStatus) {
      sheet.getRange(rowIndex, COL.TICKET_STATUS).setValue(params.ticketStatus);
    }
    if (params.assignedTo !== undefined) {
      sheet.getRange(rowIndex, COL.ASSIGNED_TO).setValue(params.assignedTo);
    }
    if (params.followUpStatus) {
      sheet.getRange(rowIndex, COL.FOLLOWUP_STATUS).setValue(params.followUpStatus);
    }
    if (params.remarks !== undefined) {
      const currentRemarks = sheet.getRange(rowIndex, COL.REMARKS).getValue();
      const updatedRemarks = params.remarks;
      sheet.getRange(rowIndex, COL.REMARKS).setValue(updatedRemarks);
    }

    lock.releaseLock();
    return jsonResponse('success', 'Enquiry updated successfully.');
  } catch (err) {
    if (lock.hasLock()) lock.releaseLock();
    return jsonResponse('error', 'Update transaction failed: ' + err.toString());
  }
}

function handleCustomerSubmission(params) {
  // Use a lock to prevent concurrent submissions from generating duplicate IDs
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // Wait up to 15 seconds
  } catch (err) {
    return jsonResponse('error', 'Server busy. Please try again.');
  }

  try {
    const name = (params.name || '').trim();
    const email = (params.email || '').trim();
    const mobile = (params.mobile || '').trim();
    const address = (params.address || '').trim();
    const message = (params.message || '').trim();
    const sourcePage = (params.sourcePage || 'Contact Page').trim();

    // Validation
    if (!name || !email || !mobile || !message) {
      return jsonResponse('error', 'All required fields must be completed.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse('error', 'Invalid email address format.');
    }

    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];
    
    // Generate Submission ID
    const submissionId = generateSubmissionId(sheet);
    const timestampStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MMM-yyyy hh:mm:ss a');
    
    // Default follow-up date (3 days from now)
    const followUpDateObj = new Date();
    followUpDateObj.setDate(followUpDateObj.getDate() + 3);
    const followUpDateStr = Utilities.formatDate(followUpDateObj, Session.getScriptTimeZone(), 'dd-MMM-yyyy');

    const newRow = [];
    newRow[COL.SUBMISSION_ID - 1] = submissionId;
    newRow[COL.TIMESTAMP - 1] = timestampStr;
    newRow[COL.CUSTOMER_NAME - 1] = name;
    newRow[COL.EMAIL - 1] = email;
    newRow[COL.MOBILE_NUMBER - 1] = mobile;
    newRow[COL.ADDRESS - 1] = address;
    newRow[COL.MESSAGE - 1] = message;
    newRow[COL.EMAIL_STATUS - 1] = 'Pending';
    newRow[COL.EMAIL_SENT_AT - 1] = '';
    newRow[COL.OWNER_NOTIF_STAT - 1] = 'Pending';
    newRow[COL.OWNER_NOTIF_TIME - 1] = '';
    newRow[COL.TICKET_STATUS - 1] = 'New';
    newRow[COL.ASSIGNED_TO - 1] = '';
    newRow[COL.FOLLOWUP_DATE - 1] = followUpDateStr;
    newRow[COL.FOLLOWUP_STATUS - 1] = 'Pending';
    newRow[COL.SOURCE_PAGE - 1] = sourcePage;
    newRow[COL.REMARKS - 1] = '';

    sheet.appendRow(newRow);
    const rowIndex = sheet.getLastRow();
    
    // Send immediate Owner Notification Email
    let ownerNotifStatus = 'Sent';
    let ownerNotifTime = '';
    let remarks = '';
    
    try {
      sendOwnerEmail(submissionId, name, email, mobile, address, message, timestampStr);
      ownerNotifTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MMM-yyyy hh:mm:ss a');
    } catch (err) {
      ownerNotifStatus = 'Failed';
      remarks = 'Owner Notification Failed: ' + err.toString();
    }

    sheet.getRange(rowIndex, COL.OWNER_NOTIF_STAT).setValue(ownerNotifStatus);
    if (ownerNotifTime) {
      sheet.getRange(rowIndex, COL.OWNER_NOTIF_TIME).setValue(ownerNotifTime);
    }
    if (remarks) {
      sheet.getRange(rowIndex, COL.REMARKS).setValue(remarks);
    }

    // Schedule 5-minute delayed customer email
    const delayMs = CONFIG.DELAY_MINUTES * 60 * 1000;
    const trigger = ScriptApp.newTrigger('sendScheduledEmail')
      .timeBased()
      .after(delayMs)
      .create();

    const triggerId = trigger.getUniqueId();
    // Save Trigger ID temporarily in Properties
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty('trigger_' + triggerId, submissionId);

    // Release Lock
    lock.releaseLock();

    return jsonResponse('success', {
      message: 'Enquiry submitted successfully.',
      submissionId: submissionId
    });

  } catch (err) {
    if (lock.hasLock()) lock.releaseLock();
    return jsonResponse('error', 'Database/Server transaction failed: ' + err.toString());
  }
}

function generateSubmissionId(sheet) {
  const today = new Date();
  const yyyymmdd = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyyMMdd');
  const prefix = 'WB-' + yyyymmdd + '-';
  
  const lastRow = sheet.getLastRow();
  let maxSeq = 0;
  
  if (lastRow > 1) {
    const ids = sheet.getRange(2, COL.SUBMISSION_ID, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      const id = String(ids[i][0]);
      if (id.startsWith(prefix)) {
        const seqStr = id.substring(prefix.length);
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  }
  
  const nextSeq = maxSeq + 1;
  const seqFormatted = ('0000' + nextSeq).slice(-4);
  return prefix + seqFormatted;
}

function sendOwnerEmail(submissionId, name, email, mobile, address, message, timestamp) {
  const subject = `🔔 New Customer Enquiry - ${submissionId}`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; color: #1e293b;">
      <h2 style="color: #1d4ed8; margin-top: 0;">New Enquiry Received</h2>
      <p>A new customer has filled out the contact form on Website Builders.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9; width: 150px;">Submission ID</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${submissionId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Customer Name</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Email</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Mobile Number</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${mobile}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Address</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${address || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Timestamp</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${timestamp}</td>
        </tr>
      </table>
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #1d4ed8;">
        <h4 style="margin: 0 0 8px 0;">Message:</h4>
        <p style="margin: 0; white-space: pre-wrap; line-height: 1.5;">${message}</p>
      </div>
    </div>
  `;

  GmailApp.sendEmail(CONFIG.BUSINESS_EMAIL, subject, '', {
    htmlBody: htmlBody,
    name: 'Website Builders Alerts'
  });
}

function sendScheduledEmail(e) {
  const triggerId = e.triggerUid;
  const properties = PropertiesService.getScriptProperties();
  const submissionId = properties.getProperty('trigger_' + triggerId);

  if (!submissionId) {
    Logger.log('No submission ID associated with trigger: ' + triggerId);
    cleanTrigger(triggerId);
    return;
  }

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];
  const lastRow = sheet.getLastRow();
  
  let rowIndex = -1;
  let rowData = null;
  
  if (lastRow > 1) {
    const ids = sheet.getRange(2, COL.SUBMISSION_ID, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === submissionId) {
        rowIndex = i + 2;
        rowData = sheet.getRange(rowIndex, 1, 1, COL.REMARKS).getValues()[0];
        break;
      }
    }
  }

  if (rowIndex === -1 || !rowData) {
    Logger.log('Enquiry row not found for ID: ' + submissionId);
    cleanTrigger(triggerId);
    return;
  }

  const name = rowData[COL.CUSTOMER_NAME - 1];
  const email = rowData[COL.EMAIL - 1];
  const emailStatus = rowData[COL.EMAIL_STATUS - 1];

  if (emailStatus === 'Sent') {
    Logger.log('Email already sent for ID: ' + submissionId);
    cleanTrigger(triggerId);
    return;
  }

  try {
    const subject = 'Thank You for Contacting Website Builders';
    const htmlBody = buildEmailTemplate(name, submissionId, rowData[COL.MESSAGE - 1]);
    
    GmailApp.sendEmail(email, subject, '', {
      htmlBody: htmlBody,
      name: CONFIG.BUSINESS_NAME,
      replyTo: CONFIG.BUSINESS_EMAIL
    });

    const sentTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MMM-yyyy hh:mm:ss a');
    sheet.getRange(rowIndex, COL.EMAIL_STATUS).setValue('Sent');
    sheet.getRange(rowIndex, COL.EMAIL_SENT_AT).setValue(sentTime);
    Logger.log('Confirmation email successfully sent to: ' + email);
  } catch (err) {
    sheet.getRange(rowIndex, COL.EMAIL_STATUS).setValue('Failed');
    const existingRemarks = sheet.getRange(rowIndex, COL.REMARKS).getValue();
    sheet.getRange(rowIndex, COL.REMARKS).setValue((existingRemarks ? existingRemarks + ' | ' : '') + 'Customer Email Failed: ' + err.toString());
    Logger.log('Failed to send confirmation email: ' + err.toString());
  } finally {
    cleanTrigger(triggerId);
  }
}

function cleanTrigger(triggerId) {
  const properties = PropertiesService.getScriptProperties();
  properties.deleteProperty('trigger_' + triggerId);
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getUniqueId() === triggerId) {
      ScriptApp.deleteTrigger(t);
    }
  });
}

function jsonResponse(status, data) {
  const responseObj = { status };
  if (status === 'success') {
    responseObj.data = data;
  } else {
    responseObj.message = data;
  }
  return ContentService
    .createTextOutput(JSON.stringify(responseObj))
    .setMimeType(ContentService.MimeType.JSON);
}

function buildEmailTemplate(customerName, submissionId, originalMessage) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Thank You – Website Builders</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#f1f5f9; color:#1e293b; }
  .wrapper { max-width:620px; margin:40px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.12); }
  .header { background:linear-gradient(135deg,#1d4ed8,#7c3aed); padding:40px 40px 30px; text-align:center; }
  .logo-icon { font-size:42px; margin-bottom:12px; }
  .logo-text { font-size:26px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; }
  .logo-text span { color:#93c5fd; }
  .tagline { font-size:13px; color:rgba(255,255,255,0.75); margin-top:6px; letter-spacing:1px; text-transform:uppercase; }
  .banner { background:linear-gradient(135deg,#0f172a,#1e1b4b); padding:35px 40px; text-align:center; }
  .checkmark { width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,#10b981,#059669); display:inline-flex; align-items:center; justify-content:center; font-size:30px; margin-bottom:18px; color: #ffffff; }
  .banner h1 { font-size:26px; font-weight:800; color:#ffffff; margin-bottom:10px; }
  .banner p { color:#94a3b8; font-size:15px; line-height:1.6; }
  .body { padding:40px; }
  .greeting { font-size:20px; font-weight:700; color:#1e293b; margin-bottom:20px; }
  .body p { font-size:15px; color:#475569; line-height:1.8; margin-bottom:16px; }
  .info-box { background:#f8fafc; border-left:4px solid #7c3aed; border-radius:8px; padding:20px 24px; margin:28px 0; }
  .info-box p { color:#334155; font-size:14px; margin-bottom:0; line-height:1.6; }
  .info-box strong { color:#1e293b; }
  .cta-wrap { text-align:center; margin:32px 0; }
  .cta-btn { display:inline-block; background:linear-gradient(135deg,#3b82f6,#8b5cf6); color:#ffffff !important; text-decoration:none; padding:14px 36px; border-radius:50px; font-size:15px; font-weight:700; letter-spacing:0.3px; box-shadow:0 4px 15px rgba(139,92,246,0.4); }
  .contact-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:28px 0; }
  .contact-item { background:#f8fafc; border-radius:10px; padding:16px 18px; border:1px solid #e2e8f0; }
  .contact-item .icon { font-size:18px; margin-bottom:8px; }
  .contact-item .label { font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; font-weight:600; }
  .contact-item .value { font-size:14px; color:#334155; font-weight:600; margin-top:4px; word-break:break-all; }
  .contact-item a { color:#3b82f6; text-decoration:none; }
  .footer { background:#0f172a; padding:28px 40px; text-align:center; }
  .footer p { color:#64748b; font-size:12px; line-height:1.7; }
  .footer a { color:#60a5fa; text-decoration:none; }
  .divider { height:1px; background:linear-gradient(to right,transparent,rgba(139,92,246,0.3),transparent); margin:24px 0; }
  @media(max-width:480px){
    .header,.banner,.body,.footer{padding:24px 20px;}
    .contact-grid{grid-template-columns:1fr;}
    .logo-text{font-size:22px;}
    .banner h1{font-size:22px;}
  }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo-icon">💻</div>
    <div class="logo-text"><span>Website</span>Builders</div>
    <div class="tagline">Professional Website Design &amp; Development</div>
  </div>

  <div class="banner">
    <div class="checkmark">✓</div>
    <h1>Thank You!</h1>
    <p>Your enquiry has been received successfully.</p>
  </div>

  <div class="body">
    <p class="greeting">Dear ${customerName},</p>
    <p>Our team has successfully received your enquiry. A team member will contact you shortly.</p>
    
    <div class="info-box">
      <p>
        <strong>Submission ID:</strong> ${submissionId}<br>
        <strong>Expected Response Time:</strong> Within approximately 5 minutes for confirmation email, 24-48 business hours for detailed response.<br>
        <strong>Your Message summary:</strong> "${originalMessage.length > 60 ? originalMessage.substring(0, 60) + '...' : originalMessage}"
      </p>
    </div>

    <div class="cta-wrap">
      <a href="${CONFIG.BUSINESS_WEBSITE}" class="cta-btn">Visit Our Website</a>
    </div>

    <div class="divider"></div>

    <div class="contact-grid">
      <div class="contact-item">
        <div class="icon">📧</div>
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${CONFIG.BUSINESS_EMAIL}">${CONFIG.BUSINESS_EMAIL}</a></div>
      </div>
      <div class="contact-item">
        <div class="icon">📞</div>
        <div class="label">Phone / WhatsApp</div>
        <div class="value"><a href="tel:${CONFIG.BUSINESS_PHONE}">${CONFIG.BUSINESS_PHONE}</a></div>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px;">
      <a href="https://twitter.com" style="margin: 0 10px; text-decoration: none;">🐦 Twitter</a>
      <a href="https://linkedin.com" style="margin: 0 10px; text-decoration: none;">💼 LinkedIn</a>
      <a href="https://instagram.com" style="margin: 0 10px; text-decoration: none;">📸 Instagram</a>
    </div>
  </div>

  <div class="footer">
    <p>
      © ${new Date().getFullYear()} Website Builders. All rights reserved.<br>
      <a href="${CONFIG.BUSINESS_WEBSITE}">${CONFIG.BUSINESS_WEBSITE}</a>
    </p>
  </div>
</div>
</body>
</html>`;
}
