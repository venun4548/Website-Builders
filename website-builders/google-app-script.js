/**
 * ============================================================
 * Website Builders — Google Apps Script Complete Backend v3.0
 * Google Sheets = SOLE permanent storage system
 * COPY THIS ENTIRE FILE INTO YOUR APPS SCRIPT EDITOR
 * ============================================================
 */

const CONFIG = {
  SPREADSHEET_ID  : '1BbDho5uGScPbuDxL2nWaNFpwESUsb6CWcY9vJkeYuUk',
  BUSINESS_NAME   : 'Website Builders',
  BUSINESS_EMAIL  : 'websitebuildeers@gmail.com',
  BUSINESS_PHONE  : '+91 7386204885',
  BUSINESS_WEBSITE: 'https://website-builders-wine.vercel.app',
  LOGO_URL        : 'https://website-builders-wine.vercel.app/images/logo.png',
  DELAY_MINUTES   : 5,
  SHARED_SECRET   : 'sec_wb_crm_77c4e569bbd18f0a1c6a58',
  TIMEZONE        : 'Asia/Kolkata',
  SUPER_ADMIN_EMAIL: 'super@websitebuilders.com',
  SUPER_ADMIN_PASS : 'Super@1234'
};

const SHEETS = {
  USERS:'Users', MESSAGES:'Messages', ENQUIRIES:'Enquiries',
  PROJECTS:'Projects', ASSIGNMENTS:'ProjectAssignments',
  UPDATES:'ProjectUpdates', ACTIVITY:'ActivityLogs',
  TASKS:'Tasks', INVOICES:'Invoices', INVOICE_ITEMS:'InvoiceItems',
  PAYMENTS:'Payments', FILES:'Files', TICKETS:'Tickets',
  TICKET_MESSAGES:'TicketMessages', BRAND_INFO:'BrandInfo',
  STAGE_HISTORY:'StageHistory', LEADS:'Leads', LEAD_NOTES:'LeadNotes',
  PORTFOLIO:'Portfolio', PRICING:'Pricing', NOTIFICATIONS:'Notifications',
  PASSWORD_RESETS:'PasswordResets', EMAIL_VERIFICATIONS:'EmailVerifications', MEETINGS:'Meetings', DOCUMENTS:'Documents', TEAMS:'Teams',
  DOC_VERIFICATION:'DocumentVerification',
  DOC_AUDIT:'DocumentAuditLogs',
  DOC_TEMPLATES:'DocumentTemplates',
  PASSWORD_OTPS:'PasswordOTPs',
  TEAM_MEMBERS:'TeamMembers',
  TASK_UPDATES:'TaskUpdates',
  TASK_ASSIGNMENTS:'TaskAssignments',
  PUSH_SUBSCRIPTIONS:'PushSubscriptions',
  MONTHLY_REPORTS:'MonthlyReports',
  EMAIL_LOGS:'EmailLogs',
  INVOICE_REMINDER_LOGS:'InvoiceReminderLogs',
  LEAD_FOLLOWUP_LOGS:'LeadFollowUpLogs',
  DEADLINE_ALERT_LOGS:'DeadlineAlertLogs',
  ABANDONED_CONTACTS:'AbandonedContacts',
  REVISION_REQUESTS:'RevisionRequests',
  REVISION_ANNOTATIONS:'RevisionAnnotations',
  SATISFACTION_SURVEYS:'SatisfactionSurveys',
  MAINTENANCE_REQUESTS:'MaintenanceRequests',
  AUDIT_LOGS:'AuditLogs',
  WEBSITE_SETTINGS:'WebsiteSettings'
};

// Column indexes (1-based)
const U={ID:1,NAME:2,EMAIL:3,MOBILE:4,PASS:5,ROLE:6,STATUS:7,CREATED_DATE:8,CREATED_TIME:9,LAST_LOGIN_DATE:10,LAST_LOGIN_TIME:11,LAST_ACT_DATE:12,LAST_ACT_TIME:13,UPD_DATE:14,UPD_TIME:15,ASSIGNED_STAFF:16,TOTAL:16};
const M={ID:1,CONV_ID:2,SENDER_ID:3,SENDER_NAME:4,SENDER_ROLE:5,RECV_ID:6,RECV_NAME:7,RECV_ROLE:8,RECIP_TYPE:9,MSG_TYPE:10,PROJ_ID:11,CUST_ID:12,SUBJECT:13,BODY:14,ATTACH:15,STATUS:16,READ_AT:17,CREATED_DATE:18,CREATED_TIME:19,UPDATED:20,TOTAL:20};
const E={SUBMISSION_ID:1,CUSTOMER_NAME:2,EMAIL:3,TIMESTAMP:4,MOBILE_NUMBER:5,ADDRESS:6,MESSAGE:7,EMAIL_STATUS:8,EMAIL_SENT_AT:9,OWNER_NOTIF_STAT:10,OWNER_NOTIF_TIME:11,TICKET_STATUS:12,ASSIGNED_TO:13,FOLLOWUP_DATE:14,FOLLOWUP_STATUS:15,SOURCE_PAGE:16,REMARKS:17,CUST_ID:18,PROJ_ID:19,TOTAL:19};
const P={ID:1,CUST_NAME:2,CUST_EMAIL:3,CUST_ID:4,PROJ_NAME:5,DESC:6,STAGE:7,PROGRESS:8,DELIVERY:9,STATUS:10,CREATED_BY:11,CREATED_DATE:12,CREATED_TIME:13,UPD_DATE:14,UPD_TIME:15,LATEST_UPDATE:16,TOTAL:16};
const A={ID:1,PROJ_ID:2,STAFF_ID:3,STAFF_NAME:4,ASSIGNED_BY:5,ASSIGNED_DATE:6,ASSIGNED_TIME:7,UNASSIGNED_DATE:8,STATUS:9,TOTAL:9};
const PU={ID:1,PROJ_ID:2,STAFF_ID:3,STAFF_NAME:4,STAGE:5,PROGRESS:6,TEXT:7,REMARK:8,CREATED_DATE:9,CREATED_TIME:10,TOTAL:10};
const AL={ID:1,USER_ID:2,USER_NAME:3,ROLE:4,ACTION:5,RELATED_ID:6,DESC:7,DATE:8,TIME:9,STATUS:10,TOTAL:10};
const T={ID:1,CLIENT_NAME:2,CLIENT_EMAIL:3,PROJ_ID:4,PROJ_NAME:5,TITLE:6,DESC:7,STAFF_ID:8,STAFF_NAME:9,PRIORITY:10,STATUS:11,DUE_DATE:12,CREATED_BY:13,CREATED_DATE:14,CREATED_TIME:15,UPD_DATE:16,UPD_TIME:17,TOTAL:17};

const SH={ID:1, PROJ_ID:2, CLIENT_NAME:3, CLIENT_EMAIL:4, OLD_STAGE:5, NEW_STAGE:6, CHANGED_BY:7, TIMESTAMP:8, REMARKS:9, TOTAL:9};
const LD={ID:1, NAME:2, EMAIL:3, PHONE:4, COMPANY:5, STATUS:6, SOURCE:7, ASSIGNED_TO:8, CREATED_AT:9, UPDATED_AT:10, TOTAL:10};
const LN={ID:1, LEAD_ID:2, USER_ID:3, NOTE:4, CREATED_AT:5, TOTAL:5};
const PT={ID:1, TITLE:2, DESC:3, IMAGE:4, LINK:5, CATEGORY:6, SORT_ORDER:7, CREATED_AT:8, TOTAL:8};
const PR={ID:1, NAME:2, DESC:3, PRICE:4, FEATURES:5, STATUS:6, CREATED_AT:7, UPDATED_AT:8, TOTAL:8};
const NT={ID:1, USER_ID:2, TITLE:3, MESSAGE:4, LINK:5, IS_READ:6, CREATED_AT:7, TOTAL:7};
const PW={ID:1, USER_ID:2, TOKEN:3, EXPIRES_AT:4, USED:5, CREATED_AT:6, TOTAL:6};
const EV={ID:1, USER_ID:2, TOKEN:3, EXPIRES_AT:4, VERIFIED:5, CREATED_AT:6, TOTAL:6};
const MT={ID:1, CLIENT_NAME:2, CLIENT_EMAIL:3, PROJ_ID:4, CUST_ID:5, STAFF_ID:6, TITLE:7, DATE:8, TIME:9, MEET_LINK:10, STATUS:11, CREATED_AT:12, TOTAL:12};

const HEADERS={
  Users:['User ID','Full Name','Email','Mobile Number','Password Hash','Role','Status','Created Date','Created Time','Last Login Date','Last Login Time','Last Activity Date','Last Activity Time','Updated Date','Updated Time','Assigned Staff ID'],
  Messages:['Message ID','Conversation ID','Sender ID','Sender Name','Sender Role','Receiver ID','Receiver Name','Receiver Role','Project ID','Customer ID','Subject','Message','Status','Read At','Created Date','Created Time','Last Updated','Deleted By Sender','Deleted By Receiver','Deleted Date','Deleted Time'],
  Enquiries:['Submission ID','Customer Name','Email','Timestamp','Mobile Number','Address','Message','Email Status','Email Sent At','Owner Notification Status','Owner Notification Time','Ticket Status','Assigned To','Followup Date','Followup Status','Source Page','Remarks','Customer ID','Project ID'],
  Projects:['Project ID','Client Name','Client Email','Customer ID','Project Name','Description','Current Stage','Progress','Expected Delivery Date','Status','Created By','Created Date','Created Time','Updated Date','Updated Time','Latest Update'],
  ProjectAssignments:['Assignment ID','Project ID','Staff ID','Staff Name','Assigned By','Assigned Date','Assigned Time','Unassigned Date','Status'],
  ProjectUpdates:['Update ID','Project ID','Staff ID','Staff Name','Stage','Progress','Update Text','Remark','Created Date','Created Time'],
  ActivityLogs:['Activity ID','User ID','User Name','Role','Action','Related ID','Description','Date','Time','Status'],
  Tasks:['Task ID','Client Name','Client Email','Project ID','Project Name','Task Title','Description','Assigned Staff ID','Assigned Staff Name','Priority','Status','Due Date','Created By','Created Date','Created Time','Updated Date','Updated Time'],
  Invoices:['Invoice ID','Client Name','Client Email','Project ID','Project Name','Customer ID','Amount','GST Amount','Total Amount','Status','Due Date','Paid At','Razorpay Order ID','Razorpay Payment ID','Created Date','Updated Date'],
  InvoiceItems:['Item ID','Invoice ID','Description','Quantity','Rate','Amount'],
  Payments:['Payment ID','Client Name','Client Email','Razorpay Order ID','Razorpay Payment ID','Invoice ID','Customer ID','Amount','Currency','Status','Signature','Paid At'],
  Files:['File ID','Client Name','Client Email','Project ID','Uploaded By','File Name','File URL','File Size','File Type','Category','Uploaded At'],
  Tickets:['Ticket ID','Client Name','Client Email','Customer ID','Subject','Priority','Status','Assigned To','Created At','Updated At'],
  TicketMessages:['Message ID','Ticket ID','Sender Email','Sender Role','Message','Timestamp'],
  BrandInfo:['Brand ID','Client Name','Client Email','User ID','Brand Name','Tagline','Primary Color','Secondary Color','Font Family','Target Audience','Competitors','Brand Values','Assets URL','Updated At'],
  StageHistory:['Stage History ID','Project ID','Client Name','Client Email','Old Stage','New Stage','Changed By','Timestamp','Remarks'],
  Leads:['Lead ID','Name','Email','Phone','Company','Status','Source','Assigned To','Created At','Updated At'],
  LeadNotes:['Note ID','Lead ID','User ID','Note Text','Created At'],
  Portfolio:['Portfolio ID','Title','Description','Image URL','Link','Category','Sort Order','Created At'],
  Pricing:['Plan ID','Plan Name','Description','Price','Features','Status','Created At','Updated At'],
  Notifications:['Notification ID','User ID','Title','Message','Link','Is Read','Created At'],
  PasswordResets:['Reset ID','User ID','Token','Expires At','Used','Created At'],
  EmailVerifications:['Verification ID','User ID','Token','Expires At','Verified','Created At'],
  Meetings:['Meeting ID','Client Name','Client Email','Project ID','Customer ID','Staff ID','Title','Date','Time','Meet Link','Status','Created At'],
  Documents:['Document ID','Client Name','Client Email','Document Number','Project ID','Client ID','Client Mobile','Title','Type','Version','Content HTML','Status','Created By','Created By Name','Created At','Updated At','Sent At','Viewed At','Verified At','Signed At','Rejected At','Rejection Reason','Expires At','Signed','Signer ID','Signer Name','Signer Email','Signature Data','Final Document URL'],
  Teams:['Team ID','Team Name','Description','Leader ID','Members','Created At'],
  DocumentVerification:['ID','Document ID','Client ID','Password Hash','OTP Hash','OTP Expiry','Password Expiry','Failed Attempts','Locked Until','Verified At','Created At','Updated At'],
  DocumentAuditLogs:['ID','Document ID','User ID','User Name','User Role','Action','Metadata','Created At'],
  DocumentTemplates:['Template ID','Template Name','Document Type','Content HTML','Version','Created By','Created At','Updated At'],
  PasswordOTPs:['otpId','email','otpHash','purpose','createdAt','expiresAt','verifiedAt','status','attempts','ipAddress','usedAt'],
  TeamMembers:['Membership ID','Team ID','Team Name','Staff ID','Staff Name','Staff Email','Role','Status','Added By','Added Date','Added Time','Removed Date','Removed Time'],
  TaskUpdates:['Update ID','Task ID','Project ID','Staff ID','Staff Name','Update Text','Progress','Visibility','Created Date','Created Time'],
  TaskAssignments:['Assignment ID','Task ID','Project ID','Staff ID','Staff Name','Team ID','Team Name','Assigned By','Assigned Date','Assigned Time','Unassigned Date','Unassigned Time','Status','Reassignment Reason'],
  PushSubscriptions:['id','userId','role','email','endpoint','p256dh','auth','device','browser','createdAt','lastUsedAt','active'],
  MonthlyReports:['id','clientId','clientName','clientEmail','projectId','projectName','month','year','fileName','generatedAt','generatedBy','sentAt','emailStatus','status'],
  EmailLogs:['id','recipient','recipientName','type','subject','relatedId','sentAt','status','error','retryCount'],
  InvoiceReminderLogs:['id','invoiceId','clientId','clientName','clientEmail','type','scheduledDate','sentAt','status'],
  LeadFollowUpLogs:['id','leadId','recipient','reminderDate','lastActivityAt','sentAt','status'],
  DeadlineAlertLogs:['id','projectId','clientName','clientEmail','alertType','scheduledDate','recipientId','sentAt','status'],
  AbandonedContacts:['id','sessionId','email','name','startedAt','lastActivityAt','abandonedAt','followUpSent','followUpSentAt','status'],
  RevisionRequests:['id','projectId','clientId','clientName','clientEmail','designId','designName','description','priority','status','createdAt','updatedAt','assignedTo','resolvedAt'],
  RevisionAnnotations:['id','revisionId','type','x','y','width','height','points','text','createdAt'],
  SatisfactionSurveys:['id','projectId','clientId','clientName','clientEmail','token','sentAt','openedAt','submittedAt','status','scoreOverall','scoreCommunication','scoreQuality','scoreTimeliness','scoreSupport','recommend','comments'],
  MaintenanceRequests:['id','projectId','clientId','clientName','clientEmail','title','description','category','priority','status','assignedTo','assignedStaffName','createdAt','updatedAt','completedAt','estimatedCost','approvedCost','clientApproval','remarks'],
  AuditLogs:['id','actorId','actorRole','action','entityType','entityId','description','ipHash','userAgent','createdAt'],
  WebsiteSettings:['id','key','value','updatedAt']
};

function initialSetup(){
  Logger.log('Initializing Website Builders Sheets...');
  repairAllHeaders();
  Logger.log('All 8 sheets initialized, headers verified and aligned.');
}


function repairAllHeaders(){
  const ss=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  Object.keys(HEADERS).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    const headerCols = HEADERS[name];
    sheet.getRange(1, 1, 1, headerCols.length).setValues([headerCols])
      .setBackground('#0f172a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
    Logger.log('Header verified and aligned for sheet: ' + name);
  });
  Logger.log('All sheet headers reset and aligned with standard schema.');
}

function createAllPaymentAndRemainingSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  const NEW_SHEETS = {
    'Invoices': ['Invoice ID','Client Name','Client Email','Project ID','Project Name','Customer ID','Amount','GST Amount','Total Amount','Status','Due Date','Paid At','Razorpay Order ID','Razorpay Payment ID','Created Date','Updated Date'],
    'InvoiceItems': ['Item ID','Invoice ID','Description','Quantity','Rate','Amount'],
    'Payments': ['Payment ID','Client Name','Client Email','Razorpay Order ID','Razorpay Payment ID','Invoice ID','Customer ID','Amount','Currency','Status','Signature','Paid At'],
    'Files': ['File ID','Client Name','Client Email','Project ID','Uploaded By','File Name','File URL','File Size','File Type','Category','Uploaded At'],
    'Tickets': ['Ticket ID','Client Name','Client Email','Customer ID','Subject','Priority','Status','Assigned To','Created At','Updated At'],
    'TicketMessages': ['Message ID','Ticket ID','Sender Email','Sender Role','Message','Timestamp'],
    'BrandInfo': ['Brand ID','Client Name','Client Email','User ID','Brand Name','Tagline','Primary Color','Secondary Color','Font Family','Target Audience','Competitors','Brand Values','Assets URL','Updated At'],
    'StageHistory':['Stage History ID','Project ID','Client Name','Client Email','Old Stage','New Stage','Changed By','Timestamp','Remarks'],
    'Leads':['Lead ID','Name','Email','Phone','Company','Status','Source','Assigned To','Created At','Updated At'],
    'LeadNotes':['Note ID','Lead ID','User ID','Note Text','Created At'],
    'Portfolio':['Portfolio ID','Title','Description','Image URL','Link','Category','Sort Order','Created At'],
    'Pricing':['Plan ID','Plan Name','Description','Price','Features','Status','Created At','Updated At'],
    'Notifications':['Notification ID','User ID','Title','Message','Link','Is Read','Created At'],
    'PasswordResets':['Reset ID','User ID','Token','Expires At','Used','Created At'],
    'EmailVerifications':['Verification ID','User ID','Token','Expires At','Verified','Created At'],
    'Documents': ['Document ID','Client Name','Client Email','Document Number','Project ID','Client ID','Client Mobile','Title','Type','Version','Content HTML','Status','Created By','Created By Name','Created At','Updated At','Sent At','Viewed At','Verified At','Signed At','Rejected At','Rejection Reason','Expires At','Signed','Signer ID','Signer Name','Signer Email','Signature Data','Final Document URL'],
    'Teams': ['Team ID','Team Name','Description','Leader ID','Members','Created At'],
    'DocumentVerification': ['ID','Document ID','Client ID','Password Hash','OTP Hash','OTP Expiry','Password Expiry','Failed Attempts','Locked Until','Verified At','Created At','Updated At'],
    'DocumentAuditLogs': ['ID','Document ID','User ID','User Name','User Role','Action','Metadata','Created At'],
    'DocumentTemplates': ['Template ID','Template Name','Document Type','Content HTML','Version','Created By','Created At','Updated At'],
    'PasswordOTPs': ['otpId','email','otpHash','purpose','createdAt','expiresAt','verifiedAt','status','attempts','ipAddress','usedAt'],
    'Meetings': ['Meeting ID','Client Name','Client Email','Project ID','Customer ID','Staff ID','Title','Date','Time','Meet Link','Status','Created At']
  };

  for (const [name, headers] of Object.entries(NEW_SHEETS)) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      .setBackground('#0f172a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
    Logger.log('Created/verified sheet: ' + name);
  }

  try {
    SpreadsheetApp.getUi().alert('All Payment, Invoice, File, and Ticket sheets created successfully!');
  } catch(e) {
    Logger.log('All Payment, Invoice, File, and Ticket sheets created successfully!');
  }
}

function repairUsersHeaders(){
  const ss=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet=ss.getSheetByName(SHEETS.USERS);
  if(!sheet){
    sheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
    Logger.log('Created fresh Users sheet with standard headers.');
    return;
  }
  sheet.getRange(1,1,1,HEADERS.Users.length).setValues([HEADERS.Users]).setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);
  Logger.log('Users sheet headers reset and aligned with standard schema.');
}

function repairEnquiriesHeaders(){
  const ss=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet=ss.getSheetByName(SHEETS.ENQUIRIES)||ss.getSheetByName('Sheet1');
  if(!sheet){
    sheet=getOrCreateSheet(SHEETS.ENQUIRIES,HEADERS.Enquiries);
    Logger.log('Created fresh Enquiries sheet with standard headers.');
    return;
  }
  if(sheet.getName()!=='Enquiries'){
    sheet.setName('Enquiries');
    Logger.log('Renamed sheet to Enquiries.');
  }
  sheet.getRange(1,1,1,HEADERS.Enquiries.length).setValues([HEADERS.Enquiries]).setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);
  Logger.log('Enquiries sheet headers reset and aligned with schema.');
}

function upgradeEnquiriesSheet(){
  repairAllHeaders();
}

function seedSuperAdmin(){
  const sheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
  if(findRowByValue(sheet,U.EMAIL,CONFIG.SUPER_ADMIN_EMAIL)>0){Logger.log('Super Admin already exists.');return;}
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const now=getNow();
    const id=generateId('USR',SHEETS.USERS,U.ID);
    sheet.appendRow([id,'Super Admin',CONFIG.SUPER_ADMIN_EMAIL,'+91 7386204885',hashPassword(CONFIG.SUPER_ADMIN_PASS),'Super Admin','ACTIVE',now.date,now.time,'','','','',now.date,now.time,'']);
    Logger.log('Super Admin seeded: '+id);
  }finally{lock.releaseLock();}
}

// ─────────────── HTTP HANDLERS ────────────────────────────────
function doPost(e){
  if(!e) return jr('error','Invalid request.');
  let p = e.parameter || {};
  let body = {};
  if (e.postData && e.postData.contents) {
    try { body = JSON.parse(e.postData.contents); } catch(err) {}
  }
  const token = p.token || body.token || p.secret || body.secret;
  if(token && token === CONFIG.SHARED_SECRET){
    const action = p.action || body.action || '';
    let data = {};
    if (p.data) {
      try { data = JSON.parse(p.data); } catch(err) {}
    } else if (body.data) {
      data = typeof body.data === 'string' ? JSON.parse(body.data) : body.data;
    } else {
      data = body;
    }
    try{
      if(action==='createUser')       return createUser(data);
      if(action==='updateUser')       return updateUser(data);
      if(action==='deleteUser')       return deleteUser(data);
      if(action==='activateUser')     return setUserStatus(data,'ACTIVE');
      if(action==='deactivateUser')   return setUserStatus(data,'INACTIVE');
      if(action==='resetPassword')    return resetPassword(data);
      if(action==='loginUser')        return loginUser(data);
      if(action==='createEnquiry')    return createEnquiry(data);
      if(action==='updateEnquiry')    return updateEnquiry(data);
      if(action==='deleteEnquiry')    return deleteEnquiry(data);
      if(action==='convertEnquiry')   return convertEnquiry(data);
      if(action==='createProject')    return createProject(data);
      if(action==='updateProject')    return updateProject(data);
      if(action==='assignStaff')      return assignStaff(data);
      if(action==='reassignStaff')    return reassignStaff(data);
      if(action==='addProjectUpdate') return addProjectUpdate(data);
      if(action==='createTask')       return createTask(data);
      if(action==='updateTask')       return updateTask(data);
      if(action==='deleteTask')       return deleteTask(data);
      if(action==='assignStaffToUser')return assignStaffToUser(data);
      if(action==='sendMessage')      return sendMessage(data);
      if(action==='markMessageRead')  return markMessageRead(data);
      if(action==='deleteMessageForMe') return deleteMessageForMe(data);
      if(action==='deleteConversationForMe') return deleteConversationForMe(data);
      if(action==='logActivity')      return logActivity(data);
      if(action==='logPayment')       return logPayment(data);
      if(action==='createInvoice')    return createInvoice(data);
      if(action==='sync_user')        return syncLegacyUser(data);
      if(action==='sync_project')     return syncProject(data);
      if(action==='sync_task')        return syncTask(data);
      if(action==='sync_meeting')     return syncMeeting(data);
      if(action==='sync_invoice')     return syncInvoice(data);
      if(action==='sync_payment')     return logPayment(data);
      if(action==='sync_message')     return sendMessage({sender_id:data.sender_id,sender_name:data.sender_name,sender_role:data.sender_role,receiver_id:data.receiver_id,receiver_name:data.receiver_name,receiver_role:data.receiver_role,conversation_id:data.conversation_id,body:data.body||data.message,subject:data.subject,project_id:data.project_id,customer_id:data.customer_id,recipient_type:data.recipient_type,message_type:data.message_type});
      if(action==='sync_audit')       return logActivity({userId:'',userName:data.user_email||'',role:'',action:data.action||'AUDIT',relatedId:'',description:data.action||'',status:data.status||'SUCCESS'});
      if(action==='update_enquiry')   return updateEnquiry({enquiry_id:p.submissionId,status:p.ticketStatus,assigned_to:p.assignedTo});
      
      // NEW ENTITIES POST
      if(action==='createStageHistory') return createStageHistory(data);
      if(action==='createLead') return createLead(data);
      if(action==='updateLead') return updateLead(data);
      if(action==='createLeadNote') return createLeadNote(data);
      if(action==='createPortfolio') return createPortfolio(data);
      if(action==='updatePortfolio') return updatePortfolio(data);
      if(action==='createPricing') return createPricing(data);
      if(action==='updatePricing') return updatePricing(data);
      if(action==='createNotification') return createNotification(data);
      if(action==='markNotificationRead') return markNotificationRead(data);
      if(action==='createPasswordReset') return createPasswordReset(data);
      if(action==='usePasswordReset') return usePasswordReset(data);
      if(action==='createEmailVerification') return createEmailVerification(data);
      if(action==='useEmailVerification') return useEmailVerification(data);
      if(action==='createMeeting') return createMeeting(data);
      if(action==='createTicket') return createTicket(data);
      if(action==='createDocument') return createDocument(data);
      if(action==='updateDocument') return updateDocument(data);
      if(action==='createBrandInfo') return createBrandInfo(data);
      if(action==='updateBrandInfo') return updateBrandInfo(data);
      if(action==='createFile') return createFile(data);
      if(action==='migrateAllSheets') return jr('success', migrateAllSheetsToStandardFormat());
      if(action==='requestDocumentSignature') return requestDocumentSignature(data);
      if(action==='signDocument') return signDocument(data);

      // PASSWORD OTP POST ACTIONS
      if(action==='SEND_PASSWORD_RESET_OTP') return sendPasswordResetOtpEmail(data);
      if(action==='savePasswordOtp') return savePasswordOtp(data);
      if(action==='getPasswordOtp') return getPasswordOtp(data);
      if(action==='updatePasswordOtp') return updatePasswordOtp(data);
      if(action==='updateUserPassword') return updateUserPassword(data);

      // WORK MANAGEMENT POST ACTIONS
      if(action==='createTeam')       return createTeam(data);
      if(action==='updateTeam')       return updateTeam(data);
      if(action==='deleteTeam')       return deleteTeam(data);
      if(action==='addTeamMember')    return addTeamMember(data);
      if(action==='removeTeamMember') return removeTeamMember(data);
      if(action==='reassignTask')     return reassignTask(data);
      if(action==='addTaskUpdate')    return addTaskUpdate(data);
      if(action==='archiveProject')   return archiveProject(data);

    }catch(err){return jr('error','Action failed: '+err.toString());}
    return jr('error','Unknown action: '+action);
  }
  return handleContactForm(p);
}

function doGet(e){
  if(!e||!e.parameter) return jr('error','Invalid request.');
  const p=e.parameter;
  if(!p.token||p.token!==CONFIG.SHARED_SECRET) return jr('error','Unauthorized.');
  const action=p.action||'getEnquiries';
  try{
    if(action==='getPasswordOtp')       return getPasswordOtp(p);
    if(action==='getUsers')             return getUsers(p);
    if(action==='getUser')              return getUser(p);
    if(action==='getEnquiries')         return getEnquiries(p);
    if(action==='getProjects')          return getProjects(p);
    if(action==='getAssignments')       return getAssignments(p);
    if(action==='getProjectUpdates')    return getProjectUpdates(p);
    if(action==='getTasks')             return getTasks(p);
    if(action==='getMessages')          return getMessages(p);
    if(action==='getConversations')     return getConversations(p);
    if(action==='getConversationThread')return getConversationThread(p);
    if(action==='getActivityLogs')      return getActivityLogs(p);
    if(action==='getStats')             return getStats(p);
    if(action==='getRecipients')        return getRecipients(p);
    if(action==='getConvWithUser')      return getConvWithUser(p);
    if(action==='getInvoices')          return getInvoices(p);
    if(action==='getPayments')          return getPayments(p);
    
    // NEW ENTITIES GET
    if(action==='getStageHistory')      return getStageHistory(p);
    if(action==='getLeads')             return getLeads(p);
    if(action==='getLeadNotes')         return getLeadNotes(p);
    if(action==='getPortfolio')         return getPortfolio(p);
    if(action==='getPricing')           return getPricing(p);
    if(action==='getNotifications')     return getNotifications(p);
    if(action==='getPasswordResets')    return getPasswordResets(p);
    if(action==='getEmailVerifications')return getEmailVerifications(p);
    if(action==='getMeetings')          return getMeetings(p);
    if(action==='getTickets')           return getTickets(p);
    if(action==='getDocuments')         return getDocuments(p);
    if(action==='getDocumentAuditLogs') return getDocumentAuditLogs(p);
    if(action==='getBrandInfo')         return getBrandInfo(p);
    if(action==='getFiles')             return getFiles(p);
    if(action==='migrateAllSheets')     return jr('success', migrateAllSheetsToStandardFormat());
    if(action==='getTeams')             return getTeams(p);
    if(action==='getTeamById')          return getTeamById(p);
    if(action==='getTeamMembers')       return getTeamMembers(p);
    if(action==='getProjectById')       return getProjectById(p);
    if(action==='getTaskById')          return getTaskById(p);
    if(action==='getTaskUpdates')       return getTaskUpdates(p);
    if(action==='getTaskAssignments')   return getTaskAssignments(p);
    if(action==='getWorkDistribution')  return getWorkDistribution(p);
    if(action==='getStaffWorkload')     return getWorkDistribution(p);
    if(action==='getProjectProgress')   return getProjectProgress(p);
    if(action==='getWorkManagementStats') return getWorkManagementStats(p);

  }catch(err){return jr('error','Read failed: '+err.toString());}
  return jr('error','Unknown action: '+action);
}

// ─────────────── USER MANAGEMENT ─────────────────────────────
function createUser(d){
  d = d || {};
  if(!d.email||!d.full_name||!d.password||!d.role) return jr('error','Name, email, password and role are required.');
  const email=d.email.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jr('error','Invalid email format.');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    const sheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
    if(findRowByValue(sheet,U.EMAIL,email)>0) return jr('error','Email already exists: '+email);
    const now=getNow();
    const userId=generateId('USR',SHEETS.USERS,U.ID);
    const roleNorm=normalizeRole(d.role);
    sheet.appendRow([userId,d.full_name.trim(),email,(d.mobile||'').trim(),hashPassword(d.password),roleNorm,'ACTIVE',now.date,now.time,'','','','',now.date,now.time,d.assigned_staff_id||'']);
    logActivity({userId,userName:d.full_name,role:roleNorm,action:'USER_CREATED',relatedId:userId,description:roleNorm+' created by '+(d.created_by||'system'),status:'SUCCESS'});
    return jr('success',{id:userId,email,role:roleNorm,message:'User created successfully.'});
  }catch(err){return jr('error','Create failed: '+err.toString());}
  finally{lock.releaseLock();}
}

function updateUser(d){
  d = d || {};
  if(!d.user_id&&!d.email) return jr('error','User ID or email required.');
  const sheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
  const row=d.user_id?findRowByValue(sheet,U.ID,d.user_id):findRowByValue(sheet,U.EMAIL,d.email.toLowerCase());
  if(row<0) return jr('error','User not found.');
  const now=getNow();
  if(d.full_name) sheet.getRange(row,U.NAME).setValue(d.full_name.trim());
  if(d.mobile)    sheet.getRange(row,U.MOBILE).setValue(d.mobile.trim());
  if(d.role)      sheet.getRange(row,U.ROLE).setValue(normalizeRole(d.role));
  if(d.assigned_staff_id!==undefined) sheet.getRange(row,U.ASSIGNED_STAFF).setValue(d.assigned_staff_id);
  // Handle status changes (boolean or string)
  if(d.status!==undefined){
    let newStatus=d.status;
    if(newStatus===true||newStatus==='true') newStatus='ACTIVE';
    else if(newStatus===false||newStatus==='false') newStatus='INACTIVE';
    newStatus=String(newStatus).toUpperCase();
    const email=sheet.getRange(row,U.EMAIL).getValue();
    if(String(email).toLowerCase()===CONFIG.SUPER_ADMIN_EMAIL.toLowerCase()&&newStatus==='INACTIVE'){
      return jr('error','Cannot deactivate protected Super Admin.');
    }
    sheet.getRange(row,U.STATUS).setValue(newStatus);
  }
  sheet.getRange(row,U.UPD_DATE).setValue(now.date);
  sheet.getRange(row,U.UPD_TIME).setValue(now.time);
  const userId=String(sheet.getRange(row,U.ID).getValue());
  logActivity({userId,userName:d.full_name||'',role:'',action:'USER_UPDATED',relatedId:userId,description:'Profile updated',status:'SUCCESS'});
  return jr('success',{message:'User updated.',id:userId});
}

function setUserStatus(d,status){
  d = d || {};
  if(!d.user_id&&!d.email) return jr('error','User ID or email required.');
  const sheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
  const row=d.user_id?findRowByValue(sheet,U.ID,d.user_id):findRowByValue(sheet,U.EMAIL,d.email.toLowerCase());
  if(row<0) return jr('error','User not found.');
  const email=sheet.getRange(row,U.EMAIL).getValue();
  if(String(email).toLowerCase()===CONFIG.SUPER_ADMIN_EMAIL.toLowerCase()&&status==='INACTIVE') return jr('error','Cannot deactivate protected Super Admin.');
  const now=getNow();
  sheet.getRange(row,U.STATUS).setValue(status);
  sheet.getRange(row,U.UPD_DATE).setValue(now.date);
  sheet.getRange(row,U.UPD_TIME).setValue(now.time);
  const userId=String(sheet.getRange(row,U.ID).getValue());
  logActivity({userId,userName:String(email),role:'',action:status==='ACTIVE'?'USER_ACTIVATED':'USER_DEACTIVATED',relatedId:userId,description:'Status set to '+status,status:'SUCCESS'});
  return jr('success',{message:'Status set to '+status+'.',id:userId});
}

function deleteUser(d){
  d = d || {};
  if(!d.user_id&&!d.email) return jr('error','User ID or email required.');
  const sheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
  const row=d.user_id?findRowByValue(sheet,U.ID,d.user_id):findRowByValue(sheet,U.EMAIL,d.email.toLowerCase());
  if(row<0) return jr('error','User not found.');
  const email=sheet.getRange(row,U.EMAIL).getValue();
  if(String(email).toLowerCase()===CONFIG.SUPER_ADMIN_EMAIL.toLowerCase()) return jr('error','Cannot delete protected Super Admin.');
  const userId=String(sheet.getRange(row,U.ID).getValue());
  const role=sheet.getRange(row,U.ROLE).getValue();
  const now=getNow();
  sheet.getRange(row,U.STATUS).setValue('INACTIVE');
  sheet.getRange(row,U.UPD_DATE).setValue(now.date);
  sheet.getRange(row,U.UPD_TIME).setValue(now.time);
  logActivity({userId,userName:String(email),role:String(role),action:'USER_DELETED',relatedId:userId,description:'User deactivated (safe delete)',status:'SUCCESS'});
  return jr('success',{message:'User deactivated safely.',id:userId});
}

function resetPassword(d){
  d = d || {};
  if((!d.user_id&&!d.email)||!d.new_password) return jr('error','User ID/email and new password required.');
  const sheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
  const row=d.user_id?findRowByValue(sheet,U.ID,d.user_id):findRowByValue(sheet,U.EMAIL,d.email.toLowerCase());
  if(row<0) return jr('error','User not found.');
  const now=getNow();
  sheet.getRange(row,U.PASS).setValue(hashPassword(d.new_password));
  sheet.getRange(row,U.UPD_DATE).setValue(now.date);
  sheet.getRange(row,U.UPD_TIME).setValue(now.time);
  const userId=String(sheet.getRange(row,U.ID).getValue());
  const email=String(sheet.getRange(row,U.EMAIL).getValue());
  logActivity({userId,userName:email,role:'',action:'PASSWORD_RESET',relatedId:userId,description:'Password reset',status:'SUCCESS'});
  return jr('success',{message:'Password reset successfully.',id:userId});
}

function loginUser(d){
  d = d || {};
  if(!d.email||!d.password) return jr('error','Email and password required.');
  const email=d.email.trim().toLowerCase();
  const sheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
  const row=findRowByValue(sheet,U.EMAIL,email);
  if(row<0) return jr('error','Invalid email or password.');
  const r=sheet.getRange(row,1,1,U.TOTAL).getValues()[0];
  const status=String(r[U.STATUS-1]).toUpperCase();
  if(status!=='ACTIVE') return jr('error','Account is inactive. Contact administrator.');
  const stored=String(r[U.PASS-1]);
  if(!verifyPassword(d.password,stored)) return jr('error','Invalid email or password.');
  const now=getNow();
  sheet.getRange(row,U.LAST_LOGIN_DATE).setValue(now.date);
  sheet.getRange(row,U.LAST_LOGIN_TIME).setValue(now.time);
  sheet.getRange(row,U.LAST_ACT_DATE).setValue(now.date);
  sheet.getRange(row,U.LAST_ACT_TIME).setValue(now.time);
  const userId=String(r[U.ID-1]);
  const role=String(r[U.ROLE-1]);
  logActivity({userId,userName:String(r[U.NAME-1]),role,action:'LOGIN',relatedId:userId,description:'User logged in',status:'SUCCESS'});
  return jr('success',{user_id:userId,id:userId,full_name:String(r[U.NAME-1]),email,mobile:String(r[U.MOBILE-1]),role,status,assigned_staff_id:String(r[U.ASSIGNED_STAFF-1]||''),last_login:now.date+' '+now.time});
}

function getUserColMap(sheet){
  const fallback = Object.assign({}, U);
  const lastCol = sheet.getLastColumn();
  if (sheet.getLastRow() < 1 || lastCol < 1) return fallback;
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const colMap = {};
  headers.forEach((h, idx) => {
    const raw = String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!raw) return;
    const col1 = idx + 1;
    if (['userid', 'id'].includes(raw)) colMap.ID = col1;
    else if (['fullname', 'name', 'username', 'user'].includes(raw)) colMap.NAME = col1;
    else if (['email', 'emailaddress', 'mail'].includes(raw)) colMap.EMAIL = col1;
    else if (['mobilenumber', 'mobile', 'phone', 'phonenumber', 'contact'].includes(raw)) colMap.MOBILE = col1;
    else if (['passwordhash', 'password', 'pass', 'hash'].includes(raw)) colMap.PASS = col1;
    else if (['role', 'userrole'].includes(raw)) colMap.ROLE = col1;
    else if (['status', 'userstatus'].includes(raw)) colMap.STATUS = col1;
    else if (['createddate', 'createdat', 'created'].includes(raw)) colMap.CREATED_DATE = col1;
    else if (['createdtime'].includes(raw)) colMap.CREATED_TIME = col1;
    else if (['lastlogindate', 'lastlogin'].includes(raw)) colMap.LAST_LOGIN_DATE = col1;
    else if (['lastlogintime'].includes(raw)) colMap.LAST_LOGIN_TIME = col1;
    else if (['lastactivitydate', 'lastactdate', 'lastactivity'].includes(raw)) colMap.LAST_ACT_DATE = col1;
    else if (['lastactivitytime', 'lastacttime'].includes(raw)) colMap.LAST_ACT_TIME = col1;
    else if (['updateddate', 'upddate', 'updatedat', 'updated'].includes(raw)) colMap.UPD_DATE = col1;
    else if (['updatedtime', 'updtime'].includes(raw)) colMap.UPD_TIME = col1;
    else if (['assignedstaffid', 'assignedstaff', 'assignedto', 'staffid', 'staff'].includes(raw)) colMap.ASSIGNED_STAFF = col1;
  });
  return Object.assign({}, fallback, colMap, { TOTAL: Math.max(lastCol, U.TOTAL) });
}

function getUsers(p){
  p = p || {};
  const sheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
  const colMap=getUserColMap(sheet);
  const last=sheet.getLastRow();
  if(last<2) return jr('success',[]);
  const totalCols = Math.max(sheet.getLastColumn(), colMap.TOTAL || U.TOTAL);
  let rawRows=sheet.getRange(2,1,last-1,totalCols).getValues();
  
  // Build name lookup map: ID -> full_name, email -> full_name
  const nameMap = {};
  const idCol = colMap.ID || U.ID;
  const emailCol = colMap.EMAIL || U.EMAIL;
  const nameCol = colMap.NAME || U.NAME;
  rawRows.forEach(r => {
    const uid = String(r[idCol-1] || '').trim();
    const uemail = String(r[emailCol-1] || '').trim().toLowerCase();
    const uname = String(r[nameCol-1] || '').trim();
    if(uid) nameMap[uid] = uname;
    if(uemail) nameMap[uemail] = uname;
  });

  // Calculate project counts per staff
  const projSheet = getOrCreateSheet(SHEETS.ASSIGNMENTS, HEADERS.ProjectAssignments);
  const pLast = projSheet.getLastRow();
  const staffProjCount = {};
  if (pLast >= 2) {
    projSheet.getRange(2, 1, pLast - 1, A.TOTAL).getValues().forEach(r => {
      if (String(r[A.STATUS - 1]).toUpperCase() === 'ACTIVE') {
        const sid = String(r[A.STAFF_ID - 1] || '');
        if (sid) staffProjCount[sid] = (staffProjCount[sid] || 0) + 1;
      }
    });
  }

  // Calculate task counts per staff
  const taskSheet = getOrCreateSheet(SHEETS.TASKS, HEADERS.Tasks);
  const tLast = taskSheet.getLastRow();
  const staffTaskCount = {};
  if (tLast >= 2) {
    taskSheet.getRange(2, 1, tLast - 1, T.TOTAL).getValues().forEach(r => {
      const sid = String(r[T.STAFF_ID - 1] || '');
      if (sid) staffTaskCount[sid] = (staffTaskCount[sid] || 0) + 1;
    });
  }

  let users = rawRows.map(r => {
    const u = userRowToDict(r, colMap);
    u.assigned_staff_name = nameMap[u.assigned_staff_id] || '';
    u.assigned_projects_count = staffProjCount[u.id] || 0;
    u.tasks_count = staffTaskCount[u.id] || 0;
    return u;
  }).filter(u=>u.user_id);

  if(p.role)        users=users.filter(u=>u.role.toLowerCase()===p.role.toLowerCase());
  if(p.status)      users=users.filter(u=>u.status.toLowerCase()===p.status.toLowerCase());
  if(p.active_only==='true') users=users.filter(u=>u.status.toUpperCase()==='ACTIVE');
  return jr('success',users);
}

function getUser(p){
  p = p || {};
  const sheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
  const colMap=getUserColMap(sheet);
  const idCol = colMap.ID || U.ID;
  const emailCol = colMap.EMAIL || U.EMAIL;
  const row=p.user_id?findRowByValue(sheet,idCol,p.user_id):(p.email?findRowByValue(sheet,emailCol,p.email.toLowerCase()):-1);
  if(row<0) return jr('error','User not found.');
  const totalCols = Math.max(sheet.getLastColumn(), colMap.TOTAL || U.TOTAL);
  const u = userRowToDict(sheet.getRange(row,1,1,totalCols).getValues()[0], colMap);
  if(u.assigned_staff_id) {
    const sRow = findRowByValue(sheet, idCol, u.assigned_staff_id);
    if(sRow > 0) {
      u.assigned_staff_name = String(sheet.getRange(sRow, colMap.NAME || U.NAME).getValue() || '');
    }
  }
  return jr('success', u);
}

function assignStaffToUser(d){
  d = d || {};
  const userId = d.user_id || d.id || d.client_id;
  if(!userId) return jr('error','User ID required.');
  const staffId = d.assigned_staff_id !== undefined ? d.assigned_staff_id : (d.staff_id !== undefined ? d.staff_id : '');
  const sheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
  const colMap=getUserColMap(sheet);
  const idCol = colMap.ID || U.ID;
  const row=findRowByValue(sheet,idCol,userId);
  if(row<0) return jr('error','User not found.');
  const now=getNow();
  if(colMap.ASSIGNED_STAFF) sheet.getRange(row,colMap.ASSIGNED_STAFF).setValue(staffId || '');
  if(colMap.UPD_DATE) sheet.getRange(row,colMap.UPD_DATE).setValue(now.date);
  if(colMap.UPD_TIME) sheet.getRange(row,colMap.UPD_TIME).setValue(now.time);

  let staffName = '';
  if(staffId){
    const sRow = findRowByValue(sheet, idCol, staffId);
    if(sRow > 0) staffName = String(sheet.getRange(sRow, colMap.NAME || U.NAME).getValue() || '');
  }

  logActivity({userId:d.assigned_by||'',userName:'',role:'',action:'STAFF_ASSIGNED_TO_USER',relatedId:userId,description:'Assigned staff '+(staffName||staffId||'Unassigned')+' to user '+userId,status:'SUCCESS'});
  return jr('success',{message:'Staff assigned to client successfully.',user_id:userId,assigned_staff_id:staffId,assigned_staff_name:staffName});
}

function userRowToDict(r, colMap){
  colMap = colMap || U;
  const getVal = (col) => (col && col <= r.length) ? String(r[col - 1] || '') : '';
  return {
    user_id: getVal(colMap.ID),
    id: getVal(colMap.ID),
    full_name: getVal(colMap.NAME),
    email: getVal(colMap.EMAIL),
    mobile: getVal(colMap.MOBILE),
    role: getVal(colMap.ROLE),
    status: getVal(colMap.STATUS),
    is_active: getVal(colMap.STATUS).toUpperCase() === 'ACTIVE',
    created_at: getVal(colMap.CREATED_DATE) + ' ' + getVal(colMap.CREATED_TIME),
    last_login: getVal(colMap.LAST_LOGIN_DATE) + ' ' + getVal(colMap.LAST_LOGIN_TIME),
    last_activity: getVal(colMap.LAST_ACT_DATE) + ' ' + getVal(colMap.LAST_ACT_TIME),
    updated_at: getVal(colMap.UPD_DATE) + ' ' + getVal(colMap.UPD_TIME),
    assigned_staff_id: getVal(colMap.ASSIGNED_STAFF)
  };
}

// ─────────────── ENQUIRIES ────────────────────────────────────
function getEnquiryColMap(sheet){
  const fallback = Object.assign({}, E);
  const lastCol = sheet.getLastColumn();
  if (sheet.getLastRow() < 1 || lastCol < 1) return fallback;
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const colMap = {};
  headers.forEach((h, idx) => {
    const raw = String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!raw) return;
    const col1 = idx + 1;
    if (['submissionid', 'enquiryid', 'id', 'ticketid'].includes(raw)) colMap.SUBMISSION_ID = col1;
    else if (['timestamp', 'date', 'createddate', 'createdat', 'time', 'datetime'].includes(raw)) colMap.TIMESTAMP = col1;
    else if (['customername', 'name', 'fullname', 'clientname', 'user', 'username'].includes(raw)) colMap.CUSTOMER_NAME = col1;
    else if (['email', 'emailaddress', 'mail'].includes(raw)) colMap.EMAIL = col1;
    else if (['mobilenumber', 'mobile', 'phone', 'phonenumber', 'contact', 'contactnumber'].includes(raw)) colMap.MOBILE_NUMBER = col1;
    else if (['address', 'location', 'city'].includes(raw)) colMap.ADDRESS = col1;
    else if (['message', 'enquiry', 'query', 'comments', 'description', 'details'].includes(raw)) colMap.MESSAGE = col1;
    else if (['emailstatus', 'mailstatus'].includes(raw)) colMap.EMAIL_STATUS = col1;
    else if (['emailsentat', 'mailsentat', 'emailsenttime'].includes(raw)) colMap.EMAIL_SENT_AT = col1;
    else if (['ownernotificationstatus', 'ownerstatus', 'ownernotifstatus', 'ownernotifstat'].includes(raw)) colMap.OWNER_NOTIF_STAT = col1;
    else if (['ownernotificationtime', 'ownertime', 'ownernotiftime'].includes(raw)) colMap.OWNER_NOTIF_TIME = col1;
    else if (['ticketstatus', 'status', 'enquirystatus'].includes(raw)) colMap.TICKET_STATUS = col1;
    else if (['assignedto', 'assignee', 'staff', 'assignedstaff'].includes(raw)) colMap.ASSIGNED_TO = col1;
    else if (['followupdate', 'followup'].includes(raw)) colMap.FOLLOWUP_DATE = col1;
    else if (['followupstatus'].includes(raw)) colMap.FOLLOWUP_STATUS = col1;
    else if (['sourcepage', 'source', 'page'].includes(raw)) colMap.SOURCE_PAGE = col1;
    else if (['remarks', 'remark', 'notes', 'note'].includes(raw)) colMap.REMARKS = col1;
    else if (['customerid', 'custid', 'clientid', 'userid'].includes(raw)) colMap.CUST_ID = col1;
    else if (['projectid', 'projid'].includes(raw)) colMap.PROJ_ID = col1;
  });
  return Object.assign({}, fallback, colMap, { TOTAL: Math.max(lastCol, E.TOTAL) });
}

function createEnquiry(d){
  d = d || {};
  const name = (d.customer_name || d.name || d.fullName || d.full_name || d.customerName || '').trim();
  const email = (d.email || '').trim().toLowerCase();
  const mobile = (d.mobile || d.mobile_number || d.phone || d.phoneNumber || '').trim();
  const address = (d.address || '').trim();
  const message = (d.message || d.enquiry || d.comments || '').trim();
  const source = (d.source_page || d.sourcePage || 'Contact Page').trim();
  const customerId = (d.customer_id || d.customerId || d.userId || '').trim();
  const projectId = (d.project_id || d.projectId || '').trim();

  if(!email || !name) return jr('error','Name and email required.');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const sheet=getOrCreateSheet(SHEETS.ENQUIRIES,HEADERS.Enquiries);
    const colMap=getEnquiryColMap(sheet);
    const enqId=generateEnquiryId(sheet);
    const followUpDate=new Date();followUpDate.setDate(followUpDate.getDate()+3);
    const followUpDateStr=Utilities.formatDate(followUpDate,CONFIG.TIMEZONE,'dd-MMM-yyyy');
    
    const maxCols = Math.max(sheet.getLastColumn(), HEADERS.Enquiries.length);
    const newRow = new Array(maxCols).fill('');
    if (colMap.SUBMISSION_ID) newRow[colMap.SUBMISSION_ID-1] = enqId;
    if (colMap.TIMESTAMP) newRow[colMap.TIMESTAMP-1] = Utilities.formatDate(new Date(),CONFIG.TIMEZONE,'dd-MMM-yyyy hh:mm:ss a');
    if (colMap.CUSTOMER_NAME) newRow[colMap.CUSTOMER_NAME-1] = name;
    if (colMap.EMAIL) newRow[colMap.EMAIL-1] = email;
    if (colMap.MOBILE_NUMBER) newRow[colMap.MOBILE_NUMBER-1] = mobile;
    if (colMap.ADDRESS) newRow[colMap.ADDRESS-1] = address;
    if (colMap.MESSAGE) newRow[colMap.MESSAGE-1] = message;
    if (colMap.TICKET_STATUS) newRow[colMap.TICKET_STATUS-1] = 'New';
    if (colMap.ASSIGNED_TO) newRow[colMap.ASSIGNED_TO-1] = d.assigned_to || d.assigned_staff_id || '';
    if (colMap.FOLLOWUP_DATE) newRow[colMap.FOLLOWUP_DATE-1] = followUpDateStr;
    if (colMap.FOLLOWUP_STATUS) newRow[colMap.FOLLOWUP_STATUS-1] = 'Pending';
    if (colMap.SOURCE_PAGE) newRow[colMap.SOURCE_PAGE-1] = source;
    if (colMap.CUST_ID) newRow[colMap.CUST_ID-1] = customerId;
    if (colMap.PROJ_ID) newRow[colMap.PROJ_ID-1] = projectId;

    // Send customer confirmation email immediately
    const custEmailRes = sendCustomerConfirmationEmail(enqId, name, email, message);
    const custSentTime = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd-MMM-yyyy hh:mm:ss a');
    if (colMap.EMAIL_STATUS) newRow[colMap.EMAIL_STATUS-1] = custEmailRes.success ? 'Sent' : 'Failed';
    if (colMap.EMAIL_SENT_AT) newRow[colMap.EMAIL_SENT_AT-1] = custEmailRes.success ? custSentTime : '';

    // Send owner notification email immediately
    const ownerEmailRes = sendOwnerEnquiryEmail(enqId, name, email, mobile, address, message);
    const ownerSentTime = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd-MMM-yyyy hh:mm:ss a');
    if (colMap.OWNER_NOTIF_STAT) newRow[colMap.OWNER_NOTIF_STAT-1] = ownerEmailRes.success ? 'Sent' : 'Failed';
    if (colMap.OWNER_NOTIF_TIME) newRow[colMap.OWNER_NOTIF_TIME-1] = ownerEmailRes.success ? ownerSentTime : '';

    let remarksList = [];
    if (!custEmailRes.success) remarksList.push('Cust email error: ' + (custEmailRes.error || 'failed'));
    if (!ownerEmailRes.success) remarksList.push('Owner email error: ' + (ownerEmailRes.error || 'failed'));
    if (colMap.REMARKS) newRow[colMap.REMARKS-1] = remarksList.join(' | ');

    sheet.appendRow(newRow);
    logActivity({userId:customerId,userName:name,role:'User',action:'ENQUIRY_CREATED',relatedId:enqId,description:'New enquiry '+enqId,status:'SUCCESS'});
    return jr('success',{id:enqId,enquiry_id:enqId,message:'Enquiry created.',emails:{customer:custEmailRes,owner:ownerEmailRes}});
  }finally{lock.releaseLock();}
}

function updateEnquiry(d){
  d = d || {};
  const enqId = d.enquiry_id || d.id || d.submission_id || d.submissionId;
  if(!enqId) return jr('error','Enquiry ID required.');
  const sheet=getOrCreateSheet(SHEETS.ENQUIRIES,HEADERS.Enquiries);
  const colMap=getEnquiryColMap(sheet);
  const subCol = colMap.SUBMISSION_ID || E.SUBMISSION_ID;
  const row=findRowByValue(sheet,subCol,enqId);
  if(row<0) return jr('error','Enquiry not found: '+enqId);
  
  const statusVal = d.status || d.ticket_status || d.ticketStatus;
  if(statusVal && colMap.TICKET_STATUS)         sheet.getRange(row,colMap.TICKET_STATUS).setValue(statusVal);
  if(d.project_id && colMap.PROJ_ID)           sheet.getRange(row,colMap.PROJ_ID).setValue(d.project_id);
  
  var assignee = d.assigned_to !== undefined ? d.assigned_to : (d.assigned_staff_id !== undefined ? d.assigned_staff_id : (d.assigned_staff !== undefined ? d.assigned_staff : null));
  if(assignee !== null && colMap.ASSIGNED_TO)    sheet.getRange(row,colMap.ASSIGNED_TO).setValue(assignee);
  if(d.remarks !== undefined && colMap.REMARKS)  sheet.getRange(row,colMap.REMARKS).setValue(d.remarks);
  if(d.followup_status !== undefined && colMap.FOLLOWUP_STATUS) sheet.getRange(row,colMap.FOLLOWUP_STATUS).setValue(d.followup_status);
  if(d.followup_date !== undefined && colMap.FOLLOWUP_DATE)   sheet.getRange(row,colMap.FOLLOWUP_DATE).setValue(d.followup_date);
  if(d.customer_name && colMap.CUSTOMER_NAME)   sheet.getRange(row,colMap.CUSTOMER_NAME).setValue(d.customer_name);
  if(d.address && colMap.ADDRESS)               sheet.getRange(row,colMap.ADDRESS).setValue(d.address);
  if(d.mobile && colMap.MOBILE_NUMBER)          sheet.getRange(row,colMap.MOBILE_NUMBER).setValue(d.mobile);

  return jr('success',{message:'Enquiry updated.', enquiry_id: enqId});
}

function deleteEnquiry(d){
  d = d || {};
  const enqId = d.enquiry_id || d.id || d.submission_id;
  if(!enqId) return jr('error','Enquiry ID required.');
  const sheet=getOrCreateSheet(SHEETS.ENQUIRIES,HEADERS.Enquiries);
  const colMap=getEnquiryColMap(sheet);
  const subCol = colMap.SUBMISSION_ID || E.SUBMISSION_ID;
  const row=findRowByValue(sheet,subCol,enqId);
  if(row<0) return jr('error','Enquiry not found: '+enqId);
  sheet.deleteRow(row);
  logActivity({userId:d.deleted_by||d.user_id||'',userName:'',role:'Admin',action:'ENQUIRY_DELETED',relatedId:enqId,description:'Enquiry deleted: '+enqId,status:'SUCCESS'});
  return jr('success',{message:'Enquiry deleted successfully.',enquiry_id:enqId});
}

function convertEnquiry(d){
  d = d || {};
  const enqId = d.enquiry_id || d.id || d.submission_id;
  if(!enqId) return jr('error','Enquiry ID required.');
  const sheet=getOrCreateSheet(SHEETS.ENQUIRIES,HEADERS.Enquiries);
  const colMap=getEnquiryColMap(sheet);
  const subCol = colMap.SUBMISSION_ID || E.SUBMISSION_ID;
  const row=findRowByValue(sheet,subCol,enqId);
  if(row<0) return jr('error','Enquiry not found: '+enqId);
  // Read enquiry data
  const totalCols=Math.max(sheet.getLastColumn(),colMap.TOTAL||E.TOTAL);
  const r=sheet.getRange(row,1,1,totalCols).getValues()[0];
  const getVal=(colIdx)=>(colIdx&&colIdx<=r.length)?String(r[colIdx-1]||''):'';
  const custName=d.customer_name || d.name || d.client_name || getVal(colMap.CUSTOMER_NAME) || 'Customer';
  const custEmail=d.customer_email || d.email || d.client_email || getVal(colMap.EMAIL) || '';
  const custMobile=d.mobile || getVal(colMap.MOBILE_NUMBER) || '';
  let custId=d.customer_id || getVal(colMap.CUST_ID) || '';
  const enqMessage=d.description || getVal(colMap.MESSAGE) || '';

  // Ensure customer account ID exists
  if(!custId && custEmail){
    const uSheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
    const uRow=findRowByValue(uSheet,U.EMAIL,custEmail.toLowerCase());
    if(uRow>0){
      custId = String(uSheet.getRange(uRow,U.ID).getValue()||'');
    } else {
      custId = generateId('USR',SHEETS.USERS,U.ID);
      const now=getNow();
      uSheet.appendRow([custId,custName.trim(),custEmail.trim().toLowerCase(),custMobile.trim(),hashPassword('User@1234'),'User','ACTIVE',now.date,now.time,'','','','',now.date,now.time,d.assigned_staff_id||'']);
    }
    if(colMap.CUST_ID && custId) sheet.getRange(row,colMap.CUST_ID).setValue(custId);
  }
  if(!custId){
    custId = generateId('USR',SHEETS.USERS,U.ID);
  }

  // Create project
  var projResult=createProject({
    project_name: d.name||d.project_name||(custName+' Website Project'),
    customer_id: custId,
    customer_name: custName,
    customer_email: custEmail,
    client_name: custName,
    client_email: custEmail,
    description: d.description||enqMessage,
    stage: d.initial_stage||d.stage||'Requirement',
    progress: parseInt(d.initial_progress||d.progress||10),
    expected_delivery: d.expected_delivery||'',
    status: 'Active',
    staff_id: d.assigned_staff_id||'',
    staff_name: d.assigned_staff_name||'',
    created_by: d.converted_by||''
  });
  // Parse response to get project_id
  var projData={};
  try{projData=JSON.parse(projResult.getContent());}catch(e){}
  var projId=(projData.data&&(projData.data.project_id||projData.data.id))||'';
  if(!projId){
    projId = generateProjectId();
    const pSheet=getOrCreateSheet(SHEETS.PROJECTS,HEADERS.Projects);
    const now=getNow();
    pSheet.appendRow([projId,custName,custEmail,custId,(d.name||d.project_name||(custName+' Website Project')).trim(),(d.description||enqMessage||'').trim(),d.initial_stage||d.stage||'Requirement',parseInt(d.initial_progress||d.progress||10),d.expected_delivery||'','Active',d.converted_by||'',now.date,now.time,'','','']);
  }
  // Update enquiry as converted
  if(projId){
    if(colMap.TICKET_STATUS) sheet.getRange(row,colMap.TICKET_STATUS).setValue('Converted');
    if(colMap.PROJ_ID) sheet.getRange(row,colMap.PROJ_ID).setValue(projId);
    if(colMap.REMARKS) sheet.getRange(row,colMap.REMARKS).setValue('Converted to project '+projId);
  }
  logActivity({userId:d.converted_by||'',userName:'',role:'Admin',action:'ENQUIRY_CONVERTED',relatedId:enqId,description:'Enquiry converted to project '+projId,status:'SUCCESS'});
  return jr('success',{message:'Enquiry converted to project '+projId,project_id:projId,enquiry_id:enqId,id:projId});
}

function getEnquiries(p){
  p = p || {};
  const sheet=getOrCreateSheet(SHEETS.ENQUIRIES,HEADERS.Enquiries);
  const colMap=getEnquiryColMap(sheet);
  const last=sheet.getLastRow();
  if(last<2) return jr('success',[]);

  // Build name lookup for assigned_to
  const uSheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
  const uLast=uSheet.getLastRow();
  const nameMap={};
  if(uLast>=2){
    uSheet.getRange(2,1,uLast-1,U.TOTAL).getValues().forEach(r=>{
      const uid=String(r[U.ID-1]||'').trim();
      const uemail=String(r[U.EMAIL-1]||'').trim().toLowerCase();
      const uname=String(r[U.NAME-1]||'').trim();
      if(uid) nameMap[uid]=uname;
      if(uemail) nameMap[uemail]=uname;
    });
  }

  const totalCols = Math.max(sheet.getLastColumn(), colMap.TOTAL || E.TOTAL);
  let list=sheet.getRange(2,1,last-1,totalCols).getValues().map(r=>{
    const getVal = (colIdx) => (colIdx && colIdx <= r.length) ? String(r[colIdx - 1] || '') : '';
    const custName = getVal(colMap.CUSTOMER_NAME);
    const assignedTo = getVal(colMap.ASSIGNED_TO);
    const assignedStaffName = nameMap[assignedTo] || (assignedTo.startsWith('USR-') ? '' : assignedTo);
    const pId = getVal(colMap.PROJ_ID);
    const statusVal = getVal(colMap.TICKET_STATUS) || 'New';
    return {
      enquiry_id: getVal(colMap.SUBMISSION_ID),
      id: getVal(colMap.SUBMISSION_ID),
      customer_id: getVal(colMap.CUST_ID),
      customer_name: custName,
      name: custName,
      full_name: custName,
      email: getVal(colMap.EMAIL),
      mobile: getVal(colMap.MOBILE_NUMBER),
      address: getVal(colMap.ADDRESS),
      message: getVal(colMap.MESSAGE),
      status: statusVal,
      ticket_status: statusVal,
      is_converted: statusVal.toUpperCase() === 'CONVERTED' || (pId && pId.trim() !== ''),
      assigned_to: assignedTo,
      assigned_staff_id: assignedTo,
      assigned_staff_name: assignedStaffName,
      followup_date: getVal(colMap.FOLLOWUP_DATE),
      followup_status: getVal(colMap.FOLLOWUP_STATUS),
      source_page: getVal(colMap.SOURCE_PAGE),
      remarks: getVal(colMap.REMARKS),
      project_id: pId,
      created_at: getVal(colMap.TIMESTAMP)
    };
  }).filter(e=>e.enquiry_id || e.email);
  if(p.customer_id) list=list.filter(e=>e.customer_id===p.customer_id);
  if(p.status)      list=list.filter(e=>e.status.toLowerCase()===p.status.toLowerCase());
  return jr('success',list);
}

// ─────────────── PROJECTS ─────────────────────────────────────
function createProject(d){
  d = d || {};
  if(!d.project_name) return jr('error','Project name is required.');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const sheet=getOrCreateSheet(SHEETS.PROJECTS,HEADERS.Projects);
    const now=getNow();const projId=generateProjectId();
    let custName = d.customer_name || d.client_name || '';
    let custEmail = d.customer_email || d.client_email || '';
    let custId = d.customer_id || '';
    if((!custName || !custEmail) && custId){
      const uSheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
      const uRow=findRowByValue(uSheet,U.ID,custId);
      if(uRow>0){
        if(!custName) custName = String(uSheet.getRange(uRow,U.NAME).getValue()||'');
        if(!custEmail) custEmail = String(uSheet.getRange(uRow,U.EMAIL).getValue()||'');
      }
    }
    if(!custId && custEmail){
      const uSheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
      const uRow=findRowByValue(uSheet,U.EMAIL,custEmail.toLowerCase());
      if(uRow>0){
        custId = String(uSheet.getRange(uRow,U.ID).getValue()||'');
      }
    }
    if(!custId){
      custId = 'CUST-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    }
    sheet.appendRow([projId,custName,custEmail,custId,d.project_name.trim(),(d.description||'').trim(),d.stage||'Requirement',parseInt(d.progress||10),d.expected_delivery||'',d.status||'Active',d.created_by||'',now.date,now.time,'','','']);
    if(d.staff_id) assignStaff({project_id:projId,staff_id:d.staff_id,staff_name:d.staff_name||'',assigned_by:d.created_by||''});
    logActivity({userId:d.created_by||'',userName:'',role:'',action:'PROJECT_CREATED',relatedId:projId,description:'Project created: '+projId,status:'SUCCESS'});
    return jr('success',{id:projId,project_id:projId,message:'Project created successfully.'});
  }finally{lock.releaseLock();}
}

function getProjectColMap(sheet){
  const fallback = Object.assign({}, P);
  const lastCol = sheet.getLastColumn();
  if (sheet.getLastRow() < 1 || lastCol < 1) return fallback;
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const colMap = {};
  headers.forEach((h, idx) => {
    const raw = String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!raw) return;
    const col1 = idx + 1;
    if (['projectid', 'id', 'projid'].includes(raw)) colMap.ID = col1;
    else if (['clientname', 'customername', 'name', 'client', 'customer'].includes(raw)) colMap.CUST_NAME = col1;
    else if (['clientemail', 'customeremail', 'email', 'mail'].includes(raw)) colMap.CUST_EMAIL = col1;
    else if (['customerid', 'clientid', 'custid', 'userid'].includes(raw)) colMap.CUST_ID = col1;
    else if (['projectname', 'projname', 'title'].includes(raw)) colMap.PROJ_NAME = col1;
    else if (['description', 'desc', 'details'].includes(raw)) colMap.DESC = col1;
    else if (['currentstage', 'stage', 'projectstage'].includes(raw)) colMap.STAGE = col1;
    else if (['progress', 'percentage', 'prog'].includes(raw)) colMap.PROGRESS = col1;
    else if (['expecteddeliverydate', 'expecteddelivery', 'deliverydate', 'targetenddate', 'targetdate', 'duedate', 'deadline', 'delivery'].includes(raw)) colMap.DELIVERY = col1;
    else if (['status', 'projectstatus'].includes(raw)) colMap.STATUS = col1;
    else if (['createdby', 'author'].includes(raw)) colMap.CREATED_BY = col1;
    else if (['createddate', 'createdat', 'created'].includes(raw)) colMap.CREATED_DATE = col1;
    else if (['createdtime'].includes(raw)) colMap.CREATED_TIME = col1;
    else if (['updateddate', 'upddate', 'updatedat', 'updated'].includes(raw)) colMap.UPD_DATE = col1;
    else if (['updatedtime', 'updtime'].includes(raw)) colMap.UPD_TIME = col1;
    else if (['latestupdate', 'latestupdatetext', 'lastupdate', 'update', 'notes', 'latestnote'].includes(raw)) colMap.LATEST_UPDATE = col1;
  });
  return Object.assign({}, fallback, colMap, { TOTAL: Math.max(lastCol, P.TOTAL) });
}

function updateProject(d){
  d = d || {};
  const projId = d.project_id || d.id;
  if(!projId) return jr('error','Project ID required.');
  const sheet=getOrCreateSheet(SHEETS.PROJECTS,HEADERS.Projects);
  const colMap=getProjectColMap(sheet);
  const idCol = colMap.ID || P.ID;
  const row=findRowByValue(sheet,idCol,projId);
  if(row<0) return jr('error','Project not found.');
  const now=getNow();
  if((d.client_name || d.customer_name) && colMap.CUST_NAME) sheet.getRange(row,colMap.CUST_NAME).setValue(d.client_name || d.customer_name);
  if((d.client_email || d.customer_email) && colMap.CUST_EMAIL) sheet.getRange(row,colMap.CUST_EMAIL).setValue(d.client_email || d.customer_email);
  if(d.project_name && colMap.PROJ_NAME)  sheet.getRange(row,colMap.PROJ_NAME).setValue(d.project_name);
  if(d.description!==undefined && colMap.DESC)   sheet.getRange(row,colMap.DESC).setValue(d.description);
  if(d.stage && colMap.STAGE)         sheet.getRange(row,colMap.STAGE).setValue(d.stage);
  if(d.progress!==undefined && colMap.PROGRESS) sheet.getRange(row,colMap.PROGRESS).setValue(parseInt(d.progress));
  
  const expDel = d.expected_delivery || d.expected_delivery_date || d.delivery_date || d.target_end_date || d.due_date;
  if(expDel!==undefined && colMap.DELIVERY) sheet.getRange(row,colMap.DELIVERY).setValue(expDel);
  
  if(d.status && colMap.STATUS)        sheet.getRange(row,colMap.STATUS).setValue(d.status);
  
  const latUpd = d.latest_update || d.latest_update_text || d.last_update || d.update_text || d.notes;
  if(latUpd!==undefined && colMap.LATEST_UPDATE) sheet.getRange(row,colMap.LATEST_UPDATE).setValue(latUpd);
  
  if(colMap.UPD_DATE) sheet.getRange(row,colMap.UPD_DATE).setValue(now.date);
  if(colMap.UPD_TIME) sheet.getRange(row,colMap.UPD_TIME).setValue(now.time);

  if(d.staff_id || d.assigned_staff_id){
    try {
      assignStaff({
        project_id: projId,
        staff_id: d.staff_id || d.assigned_staff_id,
        staff_name: d.staff_name || d.assigned_staff_name || '',
        assigned_by: d.updated_by || d.user_id || ''
      });
    } catch(e_asg){}
  }

  return jr('success',{message:'Project updated.',id:projId,project_id:projId});
}

function getProjects(p){
  p = p || {};
  const sheet=getOrCreateSheet(SHEETS.PROJECTS,HEADERS.Projects);
  const colMap=getProjectColMap(sheet);
  const last=sheet.getLastRow();
  if(last<2) return jr('success',[]);

  // 1. Get active assignments to populate assigned_staff_name & assigned_staff_id
  const as=getOrCreateSheet(SHEETS.ASSIGNMENTS,HEADERS.ProjectAssignments);
  const aLast=as.getLastRow();
  const assignMap={};
  if(aLast>=2){
    as.getRange(2,1,aLast-1,A.TOTAL).getValues().forEach(r=>{
      if(String(r[A.STATUS-1]).toUpperCase()==='ACTIVE'){
        const pid=String(r[A.PROJ_ID-1]).trim();
        if(pid && !assignMap[pid]){
          assignMap[pid]={
            staff_id:String(r[A.STAFF_ID-1]||'').trim(),
            staff_name:String(r[A.STAFF_NAME-1]||'').trim()
          };
        }
      }
    });
  }

  // 2. Fallback staff assignments from Tasks sheet
  try {
    const tSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(SHEETS.TASKS || 'Tasks');
    if (tSheet && tSheet.getLastRow() >= 2) {
      const tRows = tSheet.getRange(2, 1, tSheet.getLastRow() - 1, T.TOTAL).getValues();
      for (let i = 0; i < tRows.length; i++) {
        const pid = String(tRows[i][T.PROJ_ID - 1] || '').trim();
        const sid = String(tRows[i][T.STAFF_ID - 1] || '').trim();
        const sname = String(tRows[i][T.STAFF_NAME - 1] || '').trim();
        if (pid && sid && !assignMap[pid]) {
          assignMap[pid] = { staff_id: sid, staff_name: sname };
        }
      }
    }
  } catch(e_t) {}

  // 3. Fallback latest updates from ProjectUpdates sheet
  const latestUpdatesMap = {};
  try {
    const uSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(SHEETS.UPDATES || 'ProjectUpdates');
    if (uSheet && uSheet.getLastRow() >= 2) {
      const uRows = uSheet.getRange(2, 1, uSheet.getLastRow() - 1, PU.TOTAL).getValues();
      for (let i = 0; i < uRows.length; i++) {
        const pid = String(uRows[i][PU.PROJ_ID - 1] || '').trim();
        const utext = String(uRows[i][PU.TEXT - 1] || uRows[i][PU.REMARK - 1] || '').trim();
        if (pid && utext) {
          latestUpdatesMap[pid] = utext;
        }
      }
    }
  } catch(e_u) {}

  // 4. User lookup for customer's assigned staff
  const userStaffMap = {};
  try {
    const uSheet = getOrCreateSheet(SHEETS.USERS, HEADERS.Users);
    const uLast = uSheet.getLastRow();
    if (uLast >= 2) {
      const uRows = uSheet.getRange(2, 1, uLast - 1, U.TOTAL).getValues();
      const userNameMap = {};
      uRows.forEach(r => {
        const uid = String(r[U.ID - 1] || '').trim();
        const uname = String(r[U.NAME - 1] || '').trim();
        if (uid) userNameMap[uid] = uname;
      });
      uRows.forEach(r => {
        const uid = String(r[U.ID - 1] || '').trim();
        const assignedStaffId = String(r[U.ASSIGNED_STAFF - 1] || '').trim();
        if (uid && assignedStaffId) {
          userStaffMap[uid] = {
            staff_id: assignedStaffId,
            staff_name: userNameMap[assignedStaffId] || ''
          };
        }
      });
    }
  } catch(e_usr) {}

  const totalCols = Math.max(sheet.getLastColumn(), colMap.TOTAL || P.TOTAL);
  let list = sheet.getRange(2, 1, last - 1, totalCols).getValues().map(r => {
    const getVal = (colIdx) => {
      if (!colIdx || colIdx > r.length) return '';
      const v = r[colIdx - 1];
      if (v instanceof Date) {
        return Utilities.formatDate(v, CONFIG.TIMEZONE, 'dd-MMM-yyyy');
      }
      return v !== null && v !== undefined ? String(v).trim() : '';
    };

    const pid = getVal(colMap.ID);
    const cid = getVal(colMap.CUST_ID);
    const asg = assignMap[pid] || (cid ? userStaffMap[cid] : null) || {};

    const expDel = getVal(colMap.DELIVERY) || 'To be determined';
    const rawUpdate = getVal(colMap.LATEST_UPDATE);
    const latUpdate = rawUpdate || latestUpdatesMap[pid] || 'Project in progress.';
    const staffName = asg.staff_name || 'Team Assigned';

    return {
      project_id: pid,
      id: pid,
      customer_name: getVal(colMap.CUST_NAME),
      client_name: getVal(colMap.CUST_NAME),
      customer_email: getVal(colMap.CUST_EMAIL),
      client_email: getVal(colMap.CUST_EMAIL),
      customer_id: cid,
      project_name: getVal(colMap.PROJ_NAME),
      name: getVal(colMap.PROJ_NAME),
      description: getVal(colMap.DESC),
      stage: getVal(colMap.STAGE) || 'Requirement',
      progress: parseInt(getVal(colMap.PROGRESS)) || 0,
      expected_delivery: expDel,
      expected_delivery_date: expDel,
      delivery_date: expDel,
      target_end_date: expDel,
      status: getVal(colMap.STATUS) || 'Active',
      created_by: getVal(colMap.CREATED_BY),
      created_at: getVal(colMap.CREATED_DATE) + ' ' + getVal(colMap.CREATED_TIME),
      created_date: getVal(colMap.CREATED_DATE),
      created_time: getVal(colMap.CREATED_TIME),
      updated_at: getVal(colMap.UPD_DATE) + ' ' + getVal(colMap.UPD_TIME),
      latest_update: latUpdate,
      latest_update_text: latUpdate,
      assigned_staff_id: asg.staff_id || '',
      assigned_staff_name: staffName,
      staff_name: staffName
    };
  }).filter(pr => pr.project_id);

  if(p.customer_id || p.client_id) {
    const cid = String(p.customer_id || p.client_id).trim().toLowerCase();
    list = list.filter(pr => String(pr.customer_id).trim().toLowerCase() === cid);
  }
  if(p.client_email) {
    const cmail = String(p.client_email).trim().toLowerCase();
    list = list.filter(pr => String(pr.client_email).trim().toLowerCase() === cmail);
  }
  if(p.status) list = list.filter(pr => pr.status.toLowerCase() === p.status.toLowerCase());
  if(p.staff_id){
    const sid = String(p.staff_id).trim();
    const staffProjectIds = new Set();
    list.forEach(pr => {
      if (String(pr.assigned_staff_id).trim() === sid) staffProjectIds.add(pr.project_id);
    });
    try {
      const tSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(SHEETS.TASKS || 'Tasks');
      if (tSheet && tSheet.getLastRow() >= 2) {
        const tRows = tSheet.getRange(2, 1, tSheet.getLastRow() - 1, T.TOTAL).getValues();
        for (let i = 0; i < tRows.length; i++) {
          if (String(tRows[i][T.STAFF_ID - 1]).trim() === sid) {
            const pid = String(tRows[i][T.PROJ_ID - 1]).trim();
            if (pid) staffProjectIds.add(pid);
          }
        }
      }
    } catch(e) {}
    list = list.filter(pr => staffProjectIds.has(pr.project_id));
  }
  return jr('success',list);
}

// ─────────────── ASSIGNMENTS ──────────────────────────────────
function assignStaff(d){
  d = d || {};
  if(!d.project_id||!d.staff_id) return jr('error','Project ID and Staff ID required.');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const sheet=getOrCreateSheet(SHEETS.ASSIGNMENTS,HEADERS.ProjectAssignments);
    const now=getNow();const asgId=generateId('ASG',SHEETS.ASSIGNMENTS,A.ID);
    let sName = d.staff_name || '';
    if(!sName && d.staff_id){
      const uSheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
      const uRow=findRowByValue(uSheet,U.ID,d.staff_id);
      if(uRow>0) sName = String(uSheet.getRange(uRow,U.NAME).getValue()||'');
    }
    sheet.appendRow([asgId,d.project_id,d.staff_id,sName,d.assigned_by||'',now.date,now.time,'','ACTIVE']);
    logActivity({userId:d.staff_id,userName:sName,role:'Staff',action:'PROJECT_ASSIGNED',relatedId:d.project_id,description:'Assigned to '+d.project_id,status:'SUCCESS'});
    return jr('success',{id:asgId,message:'Staff assigned.'});
  }finally{lock.releaseLock();}
}

function reassignStaff(d){
  d = d || {};
  if(!d.project_id||!d.new_staff_id) return jr('error','Project ID and new Staff ID required.');
  const sheet=getOrCreateSheet(SHEETS.ASSIGNMENTS,HEADERS.ProjectAssignments);
  const now=getNow();const last=sheet.getLastRow();
  if(last>=2){
    const rows=sheet.getRange(2,1,last-1,A.TOTAL).getValues();
    rows.forEach((r,i)=>{if(String(r[A.PROJ_ID-1])===d.project_id&&String(r[A.STATUS-1]).toUpperCase()==='ACTIVE'){sheet.getRange(i+2,A.UNASSIGNED_DATE).setValue(now.date);sheet.getRange(i+2,A.STATUS).setValue('UNASSIGNED');}});
  }
  return assignStaff({project_id:d.project_id,staff_id:d.new_staff_id,staff_name:d.new_staff_name||'',assigned_by:d.assigned_by||''});
}

function getAssignments(p){
  p = p || {};
  const sheet=getOrCreateSheet(SHEETS.ASSIGNMENTS,HEADERS.ProjectAssignments);
  const last=sheet.getLastRow();
  if(last<2) return jr('success',[]);
  let list=sheet.getRange(2,1,last-1,A.TOTAL).getValues().map(r=>({assignment_id:String(r[A.ID-1]),project_id:String(r[A.PROJ_ID-1]),staff_id:String(r[A.STAFF_ID-1]),staff_name:String(r[A.STAFF_NAME-1]),assigned_by:String(r[A.ASSIGNED_BY-1]),assigned_date:String(r[A.ASSIGNED_DATE-1])+' '+String(r[A.ASSIGNED_TIME-1]),unassigned_date:String(r[A.UNASSIGNED_DATE-1]),status:String(r[A.STATUS-1])})).filter(a=>a.assignment_id);
  if(p.project_id) list=list.filter(a=>a.project_id===p.project_id);
  if(p.staff_id)   list=list.filter(a=>a.staff_id===p.staff_id);
  if(p.active_only==='true') list=list.filter(a=>a.status.toUpperCase()==='ACTIVE');
  return jr('success',list);
}

// ─────────────── PROJECT UPDATES ──────────────────────────────
function addProjectUpdate(d){
  d = d || {};
  if(!d.project_id) return jr('error','Project ID required.');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const sheet=getOrCreateSheet(SHEETS.UPDATES,HEADERS.ProjectUpdates);
    const now=getNow();const updId=generateId('UPD',SHEETS.UPDATES,PU.ID);
    sheet.appendRow([updId,d.project_id,d.staff_id||'',d.staff_name||'',d.stage||'',parseInt(d.progress||0),(d.update_text||'').trim(),(d.remark||'').trim(),now.date,now.time]);
    updateProject({project_id:d.project_id,stage:d.stage||undefined,progress:d.progress!==undefined?d.progress:undefined,latest_update:d.update_text||''});
    logActivity({userId:d.staff_id||'',userName:d.staff_name||'',role:'Staff',action:'PROJECT_UPDATED',relatedId:d.project_id,description:'Update added for '+d.project_id,status:'SUCCESS'});
    return jr('success',{id:updId,message:'Update added.'});
  }finally{lock.releaseLock();}
}

function getProjectUpdates(p){
  p = p || {};
  const sheet=getOrCreateSheet(SHEETS.UPDATES,HEADERS.ProjectUpdates);
  const last=sheet.getLastRow();
  if(last<2) return jr('success',[]);
  let list=sheet.getRange(2,1,last-1,PU.TOTAL).getValues().map(r=>({update_id:String(r[PU.ID-1]),project_id:String(r[PU.PROJ_ID-1]),staff_id:String(r[PU.STAFF_ID-1]),staff_name:String(r[PU.STAFF_NAME-1]),stage:String(r[PU.STAGE-1]),progress:parseInt(r[PU.PROGRESS-1])||0,update_text:String(r[PU.TEXT-1]),remark:String(r[PU.REMARK-1]),created_at:String(r[PU.CREATED_DATE-1])+' '+String(r[PU.CREATED_TIME-1])})).filter(u=>u.update_id);
  if(p.project_id) list=list.filter(u=>u.project_id===p.project_id);
  return jr('success',list);
}

// ─────────────── TASKS ────────────────────────────────────────
function createTask(d){
  d = d || {};
  if(!d.title) return jr('error','Task title is required.');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const sheet=getOrCreateSheet(SHEETS.TASKS,HEADERS.Tasks);
    const now=getNow();const taskId=generateId('TSK',SHEETS.TASKS,T.ID);
    let staffName = d.assigned_staff_name || d.staff_name || '';
    const staffId = d.assigned_staff_id !== undefined ? d.assigned_staff_id : (d.staff_id !== undefined ? d.staff_id : '');
    if(!staffName && staffId){
      const uSheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
      const uRow=findRowByValue(uSheet,U.ID,staffId);
      if(uRow>0) staffName = String(uSheet.getRange(uRow,U.NAME).getValue()||'');
    }
    let clientName = d.client_name || d.customer_name || '';
    let clientEmail = d.client_email || d.customer_email || '';
    let projName = d.project_name || '';
    const projId = d.project_id || '';
    if(projId && (!clientName || !clientEmail || !projName)){
      const pSheet=getOrCreateSheet(SHEETS.PROJECTS,HEADERS.Projects);
      const pRow=findRowByValue(pSheet,P.ID,projId);
      if(pRow>0){
        if(!projName) projName = String(pSheet.getRange(pRow,P.PROJ_NAME).getValue()||'');
        if(!clientName) clientName = String(pSheet.getRange(pRow,P.CUST_NAME).getValue()||'');
        if(!clientEmail) clientEmail = String(pSheet.getRange(pRow,P.CUST_EMAIL).getValue()||'');
      }
    }
    const status = d.status || 'Pending';
    const priority = d.priority || 'Normal';
    const desc = d.description || '';
    const dueDate = d.due_date || '';
    const createdBy = d.created_by || '';

    sheet.appendRow([
      taskId, clientName, clientEmail, projId, projName, d.title.trim(), desc.trim(),
      staffId, staffName, priority, status, dueDate,
      createdBy, now.date, now.time, now.date, now.time
    ]);

    logActivity({
      userId: createdBy || staffId,
      userName: staffName || '',
      role: 'Staff',
      action: 'TASK_CREATED',
      relatedId: taskId,
      description: 'Task created: ' + d.title,
      status: 'SUCCESS'
    });

    return jr('success',{
      id: taskId,
      task_id: taskId,
      title: d.title,
      status: status,
      priority: priority,
      assigned_staff_id: staffId,
      assigned_staff_name: staffName,
      client_name: clientName,
      client_email: clientEmail,
      message: 'Task created successfully.'
    });
  }finally{lock.releaseLock();}
}

function updateTask(d){
  d = d || {};
  const taskId = d.task_id || d.id;
  if(!taskId) return jr('error','Task ID is required.');
  const sheet=getOrCreateSheet(SHEETS.TASKS,HEADERS.Tasks);
  const row=findRowByValue(sheet,T.ID,taskId);
  if(row<0) return jr('error','Task not found: '+taskId);

  const now=getNow();
  if(d.client_name || d.customer_name) sheet.getRange(row,T.CLIENT_NAME).setValue(d.client_name || d.customer_name);
  if(d.client_email || d.customer_email) sheet.getRange(row,T.CLIENT_EMAIL).setValue(d.client_email || d.customer_email);
  if(d.title) sheet.getRange(row,T.TITLE).setValue(d.title.trim());
  if(d.project_id) sheet.getRange(row,T.PROJ_ID).setValue(d.project_id);
  if(d.project_name) sheet.getRange(row,T.PROJ_NAME).setValue(d.project_name);
  if(d.description!==undefined) sheet.getRange(row,T.DESC).setValue(String(d.description).trim());
  if(d.priority) sheet.getRange(row,T.PRIORITY).setValue(d.priority);
  if(d.status) sheet.getRange(row,T.STATUS).setValue(d.status);
  if(d.due_date!==undefined) sheet.getRange(row,T.DUE_DATE).setValue(d.due_date);

  if(d.assigned_staff_id!==undefined || d.staff_id!==undefined){
    const staffId = d.assigned_staff_id !== undefined ? d.assigned_staff_id : d.staff_id;
    sheet.getRange(row,T.STAFF_ID).setValue(staffId || '');
    let staffName = d.assigned_staff_name || d.staff_name || '';
    if(!staffName && staffId){
      const uSheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
      const uRow=findRowByValue(uSheet,U.ID,staffId);
      if(uRow>0) staffName = String(uSheet.getRange(uRow,U.NAME).getValue()||'');
    }
    sheet.getRange(row,T.STAFF_NAME).setValue(staffName);
  }

  sheet.getRange(row,T.UPD_DATE).setValue(now.date);
  sheet.getRange(row,T.UPD_TIME).setValue(now.time);

  logActivity({
    userId: d.updated_by || '',
    userName: '',
    role: '',
    action: 'TASK_UPDATED',
    relatedId: taskId,
    description: 'Task updated: ' + (d.status ? 'status to ' + d.status : taskId),
    status: 'SUCCESS'
  });

  return jr('success',{message:'Task updated.',id:taskId,task_id:taskId});
}

function deleteTask(d){
  d = d || {};
  const taskId = d.task_id || d.id;
  if(!taskId) return jr('error','Task ID is required.');
  const sheet=getOrCreateSheet(SHEETS.TASKS,HEADERS.Tasks);
  const row=findRowByValue(sheet,T.ID,taskId);
  if(row<0) return jr('error','Task not found: '+taskId);
  sheet.deleteRow(row);
  return jr('success',{message:'Task deleted.',id:taskId});
}

function getTasks(p){
  p = p || {};
  const sheet=getOrCreateSheet(SHEETS.TASKS,HEADERS.Tasks);
  const last=sheet.getLastRow();
  if(last<2) return jr('success',[]);
  const todayIso=new Date().toISOString().split('T')[0];
  let list=sheet.getRange(2,1,last-1,T.TOTAL).getValues().map(r=>{
    const dueDate=String(r[T.DUE_DATE-1]||'');
    const status=String(r[T.STATUS-1]||'Pending');
    const isOverdue=Boolean(dueDate && dueDate < todayIso && status !== 'Completed');
    return {
      task_id:String(r[T.ID-1]),
      id:String(r[T.ID-1]),
      client_name:String(r[T.CLIENT_NAME-1]||''),
      customer_name:String(r[T.CLIENT_NAME-1]||''),
      client_email:String(r[T.CLIENT_EMAIL-1]||''),
      customer_email:String(r[T.CLIENT_EMAIL-1]||''),
      project_id:String(r[T.PROJ_ID-1]),
      project_name:String(r[T.PROJ_NAME-1]||''),
      title:String(r[T.TITLE-1]),
      name:String(r[T.TITLE-1]),
      description:String(r[T.DESC-1]),
      assigned_staff_id:String(r[T.STAFF_ID-1]),
      staff_id:String(r[T.STAFF_ID-1]),
      assigned_staff_name:String(r[T.STAFF_NAME-1]),
      staff_name:String(r[T.STAFF_NAME-1]),
      priority:String(r[T.PRIORITY-1]||'Normal'),
      status:status,
      due_date:dueDate,
      is_overdue:isOverdue,
      created_by:String(r[T.CREATED_BY-1]),
      created_at:String(r[T.CREATED_DATE-1])+' '+String(r[T.CREATED_TIME-1]),
      updated_at:String(r[T.UPD_DATE-1])+' '+String(r[T.UPD_TIME-1])
    };
  }).filter(t=>t.task_id);

  // Attach latest progress from TaskUpdates if available
  try {
    const updSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(SHEETS.TASK_UPDATES || 'TaskUpdates');
    if (updSheet && updSheet.getLastRow() >= 2) {
      const uRows = updSheet.getRange(2, 1, updSheet.getLastRow() - 1, 10).getValues();
      const taskProgressMap = {};
      const taskLatestUpdMap = {};
      const taskVisMap = {};
      for (let i = 0; i < uRows.length; i++) {
        const tid = String(uRows[i][1]).trim();
        const pVal = parseInt(uRows[i][6], 10) || 0;
        const uText = String(uRows[i][5] || '').trim();
        const vis = String(uRows[i][7] || 'INTERNAL').trim().toUpperCase();
        taskProgressMap[tid] = pVal;
        if (uText) taskLatestUpdMap[tid] = uText;
        taskVisMap[tid] = vis;
      }
      list.forEach(t => {
        t.progress = taskProgressMap[t.task_id] !== undefined ? taskProgressMap[t.task_id] : (t.status.toUpperCase() === 'COMPLETED' ? 100 : 0);
        t.latest_update = taskLatestUpdMap[t.task_id] || '';
        t.client_visible = taskVisMap[t.task_id] === 'CLIENT_VISIBLE';
      });
    } else {
      list.forEach(t => {
        t.progress = t.status.toUpperCase() === 'COMPLETED' ? 100 : 0;
        t.latest_update = '';
        t.client_visible = false;
      });
    }
  } catch(e) {
    list.forEach(t => {
      t.progress = t.status.toUpperCase() === 'COMPLETED' ? 100 : 0;
      t.latest_update = '';
      t.client_visible = false;
    });
  }

  if(p.staff_id)   list=list.filter(t=>String(t.assigned_staff_id).trim()===String(p.staff_id).trim());
  if(p.project_id) list=list.filter(t=>String(t.project_id).trim()===String(p.project_id).trim());
  if(p.status)     list=list.filter(t=>t.status.toLowerCase()===p.status.toLowerCase());
  if(p.client_view || p.role === 'Client' || p.role === 'User') {
    list = list.filter(t => t.client_visible === true);
  }
  return jr('success',list);
}

// ─────────────── MESSAGES ─────────────────────────────────────
function sendMessage(d){
  d = d || {};
  if(!d.body&&!d.message) return jr('error','Message body required.');
  if(!d.sender_id) return jr('error','Sender ID required.');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const sheet=getOrCreateSheet(SHEETS.MESSAGES,HEADERS.Messages);
    const now=getNow();
    const msgId=generateId('MSG',SHEETS.MESSAGES,M.ID);
    let convId=d.conversation_id||'';
    if(!convId&&d.receiver_id){convId=findExistingConversation(String(d.sender_id),String(d.receiver_id))||generateConvId();}
    if(!convId) convId=generateConvId();
    sheet.appendRow([msgId,convId,String(d.sender_id),d.sender_name||'',d.sender_role||'',String(d.receiver_id||0),d.receiver_name||'',d.receiver_role||'',d.recipient_type||'INDIVIDUAL',d.message_type||'DIRECT',d.project_id||'',d.customer_id||'',d.subject||'Direct Message',d.body||d.message||'',d.attachment_url||'','SENT','',now.date,now.time,now.date+' '+now.time]);
    logActivity({userId:String(d.sender_id),userName:d.sender_name||'',role:d.sender_role||'',action:'MESSAGE_SENT',relatedId:msgId,description:'Message sent: '+msgId,status:'SUCCESS'});
    return jr('success',{message_id:msgId,conversation_id:convId,message:'Message sent.',data:{message_id:msgId,conversation_id:convId}});
  }finally{lock.releaseLock();}
}

function getMessages(p){
  const sheet=getOrCreateSheet(SHEETS.MESSAGES,HEADERS.Messages);
  const last=sheet.getLastRow();
  if(last<2) return jr('success',[]);
  const uid=String(p.user_id||'');const role=(p.role||'').toLowerCase();
  let msgs=sheet.getRange(2,1,last-1,M.TOTAL).getValues().map(r=>msgRowToDict(r)).filter(m=>m.message_id);
  if(uid&&role!=='super admin'){msgs=msgs.filter(m=>String(m.sender_id)===uid||String(m.receiver_id)===uid||String(m.customer_id)===uid||(m.recipient_type==='TEAM'&&['admin','staff'].includes(role)));}
  if(p.conversation_id) msgs=msgs.filter(m=>m.conversation_id===p.conversation_id);
  return jr('success',msgs);
}

function getConversations(p){
  const sheet=getOrCreateSheet(SHEETS.MESSAGES,HEADERS.Messages);
  const last=sheet.getLastRow();
  if(last<2) return jr('success',[]);
  const uid=String(p.user_id||'');const role=(p.role||'').toLowerCase();
  let msgs=sheet.getRange(2,1,last-1,M.TOTAL).getValues().map(r=>msgRowToDict(r)).filter(m=>m.message_id);
  if(uid&&role!=='super admin'){msgs=msgs.filter(m=>String(m.sender_id)===uid||String(m.receiver_id)===uid||String(m.customer_id)===uid||(m.recipient_type==='TEAM'&&['admin','staff'].includes(role)));}
  const convMap={};
  msgs.sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||'')).forEach(m=>{
    const cid=m.conversation_id||'CONV-'+m.message_id;
    if(!convMap[cid]){convMap[cid]={conversation_id:cid,last_message:m.body||m.message,last_updated:m.created_at,last_updated_str:m.timestamp||m.created_at,sender_name:m.sender_name,receiver_name:m.receiver_name,subject:m.subject,project_id:m.project_id,unread:(String(m.receiver_id)===uid&&m.status!=='READ'),status:m.status};}
    else if(String(m.receiver_id)===uid&&m.status!=='READ'){convMap[cid].unread=true;}
  });
  return jr('success',Object.values(convMap));
}

function getConversationThread(p){
  if(!p.conversation_id) return jr('error','Conversation ID required.');
  const sheet=getOrCreateSheet(SHEETS.MESSAGES,HEADERS.Messages);
  const last=sheet.getLastRow();
  if(last<2) return jr('success',[]);
  const uid=String(p.user_id||'');const role=(p.role||'').toLowerCase();
  const allRows=sheet.getRange(2,1,last-1,M.TOTAL).getValues();
  const threadRows=allRows.filter(r=>String(r[M.CONV_ID-1])===p.conversation_id);
  if(threadRows.length===0) return jr('success',[]);
  if(uid&&role!=='super admin'&&role!=='admin'){
    const ok=threadRows.some(r=>String(r[M.SENDER_ID-1])===uid||String(r[M.RECV_ID-1])===uid||String(r[M.CUST_ID-1])===uid||(String(r[M.RECIP_TYPE-1])==='TEAM'&&role==='staff'));
    if(!ok) return jr('error','Permission denied: You are not authorized to view this conversation.');
  }
  if(uid){
    const now=getNow();
    allRows.forEach((r,i)=>{
      if(String(r[M.CONV_ID-1])===p.conversation_id&&String(r[M.RECV_ID-1])===uid&&String(r[M.STATUS-1])!=='READ'){
        sheet.getRange(i+2,M.STATUS).setValue('READ');
        sheet.getRange(i+2,M.READ_AT).setValue(now.date+' '+now.time);
        sheet.getRange(i+2,M.UPDATED).setValue(now.date+' '+now.time);
      }
    });
  }
  return jr('success',threadRows.map(r=>msgRowToDict(r)).sort((a,b)=>(a.created_at||'').localeCompare(b.created_at||'')));
}

function markMessageRead(d){
  d = d || {};
  const sheet=getOrCreateSheet(SHEETS.MESSAGES,HEADERS.Messages);
  const last=sheet.getLastRow();
  if(last<2) return jr('success',{message:'No messages.'});
  const now=getNow();
  sheet.getRange(2,1,last-1,M.TOTAL).getValues().forEach((r,i)=>{
    const matches=d.message_id?String(r[M.ID-1])===d.message_id:String(r[M.CONV_ID-1])===d.conversation_id;
    if(matches&&String(r[M.STATUS-1])!=='READ'){sheet.getRange(i+2,M.STATUS).setValue('READ');sheet.getRange(i+2,M.READ_AT).setValue(now.date+' '+now.time);sheet.getRange(i+2,M.UPDATED).setValue(now.date+' '+now.time);}
  });
  return jr('success',{message:'Marked as read.'});
}

function getConvWithUser(p){
  if(!p.user_id||!p.other_user_id) return jr('success',{conversation_id:null});
  return jr('success',{conversation_id:findExistingConversation(p.user_id,p.other_user_id)});
}



function msgRowToDict(r){
  const body=String(r[M.BODY-1]||'');const created=String(r[M.CREATED_DATE-1])+' '+String(r[M.CREATED_TIME-1]);
  return{message_id:String(r[M.ID-1]),conversation_id:String(r[M.CONV_ID-1]),sender_id:String(r[M.SENDER_ID-1]),sender_name:String(r[M.SENDER_NAME-1]),sender_role:String(r[M.SENDER_ROLE-1]),receiver_id:String(r[M.RECV_ID-1]),receiver_name:String(r[M.RECV_NAME-1]),receiver_role:String(r[M.RECV_ROLE-1]),recipient_type:String(r[M.RECIP_TYPE-1]),message_type:String(r[M.MSG_TYPE-1]),project_id:String(r[M.PROJ_ID-1]),customer_id:String(r[M.CUST_ID-1]),subject:String(r[M.SUBJECT-1]),body,message:body,status:String(r[M.STATUS-1]),read_at:String(r[M.READ_AT-1]),timestamp:created,created_at:created,last_updated:String(r[M.UPDATED-1])};
}

// ─────────────── ACTIVITY LOGS ────────────────────────────────
function logActivity(d){
  d = d || {};
  try{
    const sheet=getOrCreateSheet(SHEETS.ACTIVITY,HEADERS.ActivityLogs);
    const now=getNow();const actId=generateId('ACT',SHEETS.ACTIVITY,AL.ID);
    sheet.appendRow([actId,d.userId||'',d.userName||'',d.role||'',d.action||'',d.relatedId||'',d.description||'',now.date,now.time,d.status||'SUCCESS']);
    return jr('success',{id:actId});
  }catch(err){return jr('error','Activity log failed: '+err.toString());}
}

function getActivityLogs(p){
  const sheet=getOrCreateSheet(SHEETS.ACTIVITY,HEADERS.ActivityLogs);
  const last=sheet.getLastRow();if(last<2) return jr('success',[]);
  let list=sheet.getRange(2,1,last-1,AL.TOTAL).getValues().map(r=>({activity_id:String(r[AL.ID-1]),user_id:String(r[AL.USER_ID-1]),user_name:String(r[AL.USER_NAME-1]),role:String(r[AL.ROLE-1]),action:String(r[AL.ACTION-1]),related_id:String(r[AL.RELATED_ID-1]),description:String(r[AL.DESC-1]),date:String(r[AL.DATE-1]),time:String(r[AL.TIME-1]),timestamp:String(r[AL.DATE-1])+' '+String(r[AL.TIME-1]),status:String(r[AL.STATUS-1])})).filter(a=>a.activity_id);
  if(p.user_id) list=list.filter(a=>a.user_id===p.user_id);
  if(p.action)  list=list.filter(a=>a.action===p.action);
  if(p.limit)   list=list.slice(-parseInt(p.limit));
  return jr('success',list.reverse());
}

// ─────────────── STATS ────────────────────────────────────────
function getStats(p){
  const uid=p.user_id||'';
  let tu=0,ta=0,ts=0,tc=0,au=0,iu=0;
  const us=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);const uL=us.getLastRow();
  if(uL>=2){us.getRange(2,1,uL-1,U.TOTAL).getValues().forEach(r=>{const role=String(r[U.ROLE-1]);const st=String(r[U.STATUS-1]).toUpperCase();if(!role)return;tu++;if(role==='Admin')ta++;else if(role==='Staff')ts++;else if(role==='User')tc++;if(st==='ACTIVE')au++;else iu++;});}
  let te=0,ne=0;
  const es=getOrCreateSheet(SHEETS.ENQUIRIES,HEADERS.Enquiries);const eL=es.getLastRow();
  if(eL>=2){es.getRange(2,1,eL-1,E.TOTAL).getValues().forEach(r=>{te++;if(String(r[E.TICKET_STATUS-1])==='New')ne++;});}
  let tp=0,ap=0,pp=0;
  const ps=getOrCreateSheet(SHEETS.PROJECTS,HEADERS.Projects);const pL=ps.getLastRow();
  if(pL>=2){ps.getRange(2,1,pL-1,P.TOTAL).getValues().forEach(r=>{tp++;const st=String(r[P.STATUS-1]).toLowerCase();if(st==='active')ap++;else if(st==='pending')pp++;});}
  let tm=0,um=0;
  const ms=getOrCreateSheet(SHEETS.MESSAGES,HEADERS.Messages);const mL=ms.getLastRow();
  if(mL>=2){ms.getRange(2,1,mL-1,M.TOTAL).getValues().forEach(r=>{tm++;if(uid&&String(r[M.RECV_ID-1])===uid&&String(r[M.STATUS-1])!=='READ')um++;});}
  let ra=[];
  const as=getOrCreateSheet(SHEETS.ACTIVITY,HEADERS.ActivityLogs);const aL=as.getLastRow();
  if(aL>=2){ra=as.getRange(Math.max(2,aL-9),1,Math.min(10,aL-1),AL.TOTAL).getValues().reverse().map(r=>({activity_id:String(r[AL.ID-1]),user_name:String(r[AL.USER_NAME-1]),action:String(r[AL.ACTION-1]),description:String(r[AL.DESC-1]),timestamp:String(r[AL.DATE-1])+' '+String(r[AL.TIME-1])}));}
  return jr('success',{total_users:tu,total_admins:ta,total_staff:ts,total_clients:tc,active_users:au,inactive_users:iu,total_enquiries:te,new_enquiries:ne,total_projects:tp,active_projects:ap,pending_projects:pp,total_messages:tm,unread_messages:um,recent_activity:ra});
}

// ─────────────── CONTACT FORM & EMAIL SYSTEM ───────────────────
function handleContactForm(params){
  const lock=LockService.getScriptLock();
  try{lock.waitLock(15000);}catch(err){return jr('error','Server busy.');}
  try{
    const name=(params.customer_name||params.name||params.fullName||params.full_name||params.customerName||'').trim();
    const email=(params.email||'').trim().toLowerCase();
    const mobile=(params.mobile||params.mobile_number||params.phone||params.phoneNumber||'').trim();
    const address=(params.address||'').trim();
    const message=(params.message||params.enquiry||params.comments||'').trim();
    const source=(params.sourcePage||params.source_page||'Contact Page').trim();
    if(!name||!email||!mobile||!message) return jr('error','All required fields must be completed.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jr('error','Invalid email address format.');

    const sheet=getOrCreateSheet(SHEETS.ENQUIRIES,HEADERS.Enquiries);
    const colMap=getEnquiryColMap(sheet);
    const submissionId=generateEnquiryId(sheet);
    const timestampStr=Utilities.formatDate(new Date(),CONFIG.TIMEZONE,'dd-MMM-yyyy hh:mm:ss a');
    const followUpDate=new Date();followUpDate.setDate(followUpDate.getDate()+3);
    const followUpDateStr=Utilities.formatDate(followUpDate,CONFIG.TIMEZONE,'dd-MMM-yyyy');

    const maxCols = Math.max(sheet.getLastColumn(), HEADERS.Enquiries.length);
    const newRow = new Array(maxCols).fill('');
    if (colMap.SUBMISSION_ID) newRow[colMap.SUBMISSION_ID-1] = submissionId;
    if (colMap.TIMESTAMP) newRow[colMap.TIMESTAMP-1] = timestampStr;
    if (colMap.CUSTOMER_NAME) newRow[colMap.CUSTOMER_NAME-1] = name;
    if (colMap.EMAIL) newRow[colMap.EMAIL-1] = email;
    if (colMap.MOBILE_NUMBER) newRow[colMap.MOBILE_NUMBER-1] = mobile;
    if (colMap.ADDRESS) newRow[colMap.ADDRESS-1] = address;
    if (colMap.MESSAGE) newRow[colMap.MESSAGE-1] = message;
    if (colMap.TICKET_STATUS) newRow[colMap.TICKET_STATUS-1] = 'New';
    if (colMap.ASSIGNED_TO) newRow[colMap.ASSIGNED_TO-1] = '';
    if (colMap.FOLLOWUP_DATE) newRow[colMap.FOLLOWUP_DATE-1] = followUpDateStr;
    if (colMap.FOLLOWUP_STATUS) newRow[colMap.FOLLOWUP_STATUS-1] = 'Pending';
    if (colMap.SOURCE_PAGE) newRow[colMap.SOURCE_PAGE-1] = source;
    if (colMap.CUST_ID) newRow[colMap.CUST_ID-1] = params.customer_id || '';
    if (colMap.PROJ_ID) newRow[colMap.PROJ_ID-1] = params.project_id || '';

    // Send customer confirmation email immediately
    const custEmailRes = sendCustomerConfirmationEmail(submissionId, name, email, message);
    const custSentTime = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd-MMM-yyyy hh:mm:ss a');
    if (colMap.EMAIL_STATUS) newRow[colMap.EMAIL_STATUS-1] = custEmailRes.success ? 'Sent' : 'Failed';
    if (colMap.EMAIL_SENT_AT) newRow[colMap.EMAIL_SENT_AT-1] = custEmailRes.success ? custSentTime : '';

    // Send owner notification email immediately
    const ownerEmailRes = sendOwnerEnquiryEmail(submissionId, name, email, mobile, address, message);
    const ownerSentTime = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd-MMM-yyyy hh:mm:ss a');
    if (colMap.OWNER_NOTIF_STAT) newRow[colMap.OWNER_NOTIF_STAT-1] = ownerEmailRes.success ? 'Sent' : 'Failed';
    if (colMap.OWNER_NOTIF_TIME) newRow[colMap.OWNER_NOTIF_TIME-1] = ownerEmailRes.success ? ownerSentTime : '';

    let remarksList = [];
    if (!custEmailRes.success) remarksList.push('Cust email error: ' + (custEmailRes.error || 'failed'));
    if (!ownerEmailRes.success) remarksList.push('Owner email error: ' + (ownerEmailRes.error || 'failed'));
    if (colMap.REMARKS) newRow[colMap.REMARKS-1] = remarksList.join(' | ');

    sheet.appendRow(newRow);
    logActivity({userId:params.customer_id||'',userName:name,role:'User',action:'ENQUIRY_CREATED',relatedId:submissionId,description:'Contact form enquiry '+submissionId,status:'SUCCESS'});
    return jr('success',{message:'Enquiry submitted successfully.',submissionId,emails:{customer:custEmailRes,owner:ownerEmailRes}});
  }catch(err){
    return jr('error','Submission failed: '+err.toString());
  }finally{
    if(lock.hasLock())lock.releaseLock();
  }
}

function generateEnquiryId(sheet){
  const today=new Date();
  const yyyymmdd=Utilities.formatDate(today,CONFIG.TIMEZONE,'yyyyMMdd');
  const prefix='WB-'+yyyymmdd+'-';
  const lastRow=sheet.getLastRow();let maxSeq=0;
  if(lastRow>1){
    const colMap=getEnquiryColMap(sheet);
    const subCol = colMap.SUBMISSION_ID || E.SUBMISSION_ID;
    const ids=sheet.getRange(2,subCol,lastRow-1,1).getValues();
    ids.forEach(r=>{const id=String(r[0]);if(id.startsWith(prefix)){const n=parseInt(id.substring(prefix.length),10);if(!isNaN(n)&&n>maxSeq)maxSeq=n;}});
  }
  return prefix+('0000'+(maxSeq+1)).slice(-4);
}

function sendEmailSafely(recipient, subject, htmlBody, options){
  options = options || {};
  if(!recipient || !recipient.includes('@')){
    return {success:false, error:'Invalid recipient email address: ' + recipient};
  }
  const payload = {
    to: recipient.trim(),
    subject: subject,
    htmlBody: htmlBody,
    name: options.name || CONFIG.BUSINESS_NAME,
    replyTo: options.replyTo || CONFIG.BUSINESS_EMAIL
  };

  // Try standard MailApp first
  try {
    MailApp.sendEmail(payload);
    return {success:true, method:'MailApp'};
  } catch(err1) {
    Logger.log('MailApp.sendEmail failed: ' + err1.toString() + ', attempting GmailApp fallback...');
    // Fallback to GmailApp
    try {
      GmailApp.sendEmail(recipient.trim(), subject, '', {
        htmlBody: htmlBody,
        name: options.name || CONFIG.BUSINESS_NAME,
        replyTo: options.replyTo || CONFIG.BUSINESS_EMAIL
      });
      return {success:true, method:'GmailApp'};
    } catch(err2) {
      Logger.log('GmailApp.sendEmail also failed: ' + err2.toString());
      return {success:false, error:err2.toString()};
    }
  }
}

function sendCustomerConfirmationEmail(enqId, name, email, message){
  const subject = 'Thank You for Contacting ' + CONFIG.BUSINESS_NAME + ' [' + enqId + ']';
  const body = buildEmailTemplate(name, enqId, message);
  return sendEmailSafely(email, subject, body, {
    name: CONFIG.BUSINESS_NAME,
    replyTo: CONFIG.BUSINESS_EMAIL
  });
}

function sendOwnerEnquiryEmail(enqId, name, email, mobile, address, message){
  const subject = 'New Enquiry Received — ' + enqId + ' (' + name + ')';
  const body = buildOwnerEmailTemplate(enqId, name, email, mobile, address, message);
  return sendEmailSafely(CONFIG.BUSINESS_EMAIL, subject, body, {
    name: CONFIG.BUSINESS_NAME + ' Alerts',
    replyTo: email || CONFIG.BUSINESS_EMAIL
  });
}

function buildOwnerEmailTemplate(enqId, name, email, mobile, address, message){
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;}.card{max-width:600px;margin:24px auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);}.hdr{background:#0f172a;color:#fff;padding:24px;}.hdr h2{margin:0;font-size:20px;color:#38bdf8;}.content{padding:24px;line-height:1.6;}.field{margin-bottom:12px;}.field b{color:#475569;display:inline-block;width:120px;}.msgbox{background:#f1f5f9;padding:16px;border-left:4px solid #0284c7;border-radius:4px;margin-top:16px;}.footer{background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;}</style></head><body><div class="card"><div class="hdr"><h2>⚡ New Enquiry Received — ${enqId}</h2></div><div class="content"><div class="field"><b>Customer:</b> <strong>${name}</strong></div><div class="field"><b>Email:</b> <a href="mailto:${email}">${email}</a></div><div class="field"><b>Phone:</b> <a href="tel:${mobile}">${mobile}</a></div><div class="field"><b>Address:</b> ${address||'N/A'}</div><div class="msgbox"><b>Message:</b><p style="margin:8px 0 0 0; white-space:pre-wrap;">${message}</p></div></div><div class="footer">Website Builders CRM • Automated Lead Notification</div></div></body></html>`;
}

function testEmail(recipientEmail){
  const target = recipientEmail || CONFIG.BUSINESS_EMAIL;
  Logger.log('Sending test email to: ' + target);
  const result = sendEmailSafely(
    target,
    'Website Builders — Email System Test',
    '<div style="font-family:sans-serif;padding:20px;"><h2>Email System Functional ✅</h2><p>This test verifies that MailApp/GmailApp is authorized and successfully sending emails from Google Apps Script.</p></div>'
  );
  Logger.log('Test Result: ' + JSON.stringify(result));
  return result;
}

// --------------------------------------------------------
// MEETINGS MODULE (Calendar / Meet Integration via GAS)
// --------------------------------------------------------

function createMeeting(d) {
  d = d || {};
  if (!d.project_id || !d.date || !d.time) return jr('error', 'Missing required fields (project_id, date, time).');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet = getOrCreateSheet(SHEETS.MEETINGS, HEADERS.Meetings);
    const meetId = generateId('MT', SHEETS.MEETINGS, MT.ID);
    const now = getNow();
    const meetLink = "https://meet.google.com/new"; // Generic fallback link if Advanced Service is disabled
    
    let clientName = d.client_name || d.customer_name || '';
    let clientEmail = d.client_email || d.customer_email || '';
    if ((!clientName || !clientEmail) && d.customer_id) {
      const uSheet = getOrCreateSheet(SHEETS.USERS, HEADERS.Users);
      const uRow = findRowByValue(uSheet, U.ID, d.customer_id);
      if (uRow > 0) {
        if (!clientName) clientName = String(uSheet.getRange(uRow, U.NAME).getValue() || '');
        if (!clientEmail) clientEmail = String(uSheet.getRange(uRow, U.EMAIL).getValue() || '');
      }
    }
    
    sheet.appendRow([
      meetId, clientName, clientEmail, d.project_id, d.customer_id || '', d.staff_id || '',
      d.title || 'Project Consultation', d.date, d.time,
      meetLink, 'SCHEDULED', now.date + ' ' + now.time
    ]);
    return jr('success', { message: 'Meeting scheduled successfully.', meeting_id: meetId, meet_link: meetLink, client_name: clientName, client_email: clientEmail });
  } catch (e) {
    return jr('error', 'Failed to schedule meeting: ' + e.toString());
  } finally {
    lock.releaseLock();
  }
}

function getMeetings(p) {
  p = p || {};
  const sheet = getOrCreateSheet(SHEETS.MEETINGS, HEADERS.Meetings);
  const last = sheet.getLastRow();
  if (last < 2) return jr('success', []);
  
  let list = sheet.getRange(2, 1, last - 1, MT.TOTAL).getValues().map(r => ({
    meeting_id: String(r[MT.ID - 1]),
    id: String(r[MT.ID - 1]),
    client_name: String(r[MT.CLIENT_NAME - 1] || ''),
    customer_name: String(r[MT.CLIENT_NAME - 1] || ''),
    client_email: String(r[MT.CLIENT_EMAIL - 1] || ''),
    customer_email: String(r[MT.CLIENT_EMAIL - 1] || ''),
    project_id: String(r[MT.PROJ_ID - 1]),
    customer_id: String(r[MT.CUST_ID - 1]),
    staff_id: String(r[MT.STAFF_ID - 1]),
    title: String(r[MT.TITLE - 1]),
    date: String(r[MT.DATE - 1]),
    time: String(r[MT.TIME - 1]),
    meet_link: String(r[MT.MEET_LINK - 1]),
    status: String(r[MT.STATUS - 1]),
    created_at: String(r[MT.CREATED_AT - 1])
  })).filter(m => m.meeting_id);

  if (p.project_id) list = list.filter(m => m.project_id === p.project_id);
  if (p.customer_id) list = list.filter(m => m.customer_id === p.customer_id);

  return jr('success', list);
}

// --------------------------------------------------------
// TICKETS MODULE (Support & Maintenance)
// --------------------------------------------------------

function createTicket(d) {
  d = d || {};
  if (!d.subject || !d.customer_id) return jr('error', 'Missing required fields.');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet = getOrCreateSheet(SHEETS.TICKETS, HEADERS.Tickets);
    const ticketId = generateId('TK', SHEETS.TICKETS, 1);
    const now = getNow();
    let custName = d.customer_name || d.client_name || '';
    let custEmail = d.customer_email || d.client_email || '';
    if ((!custName || !custEmail) && d.customer_id) {
      const uSheet = getOrCreateSheet(SHEETS.USERS, HEADERS.Users);
      const uRow = findRowByValue(uSheet, U.ID, d.customer_id);
      if (uRow > 0) {
        if (!custName) custName = String(uSheet.getRange(uRow, U.NAME).getValue() || '');
        if (!custEmail) custEmail = String(uSheet.getRange(uRow, U.EMAIL).getValue() || '');
      }
    }
    sheet.appendRow([
      ticketId, custName, custEmail, d.customer_id,
      d.subject, d.priority || 'Medium', 'Open', d.assigned_to || '',
      now.date + ' ' + now.time, now.date + ' ' + now.time
    ]);
    return jr('success', { message: 'Ticket created successfully.', ticket_id: ticketId });
  } catch (e) {
    return jr('error', 'Failed to create ticket: ' + e.toString());
  } finally {
    lock.releaseLock();
  }
}

function getTickets(p) {
  p = p || {};
  const sheet = getOrCreateSheet(SHEETS.TICKETS, HEADERS.Tickets);
  const last = sheet.getLastRow();
  if (last < 2) return jr('success', []);
  
  let list = sheet.getRange(2, 1, last - 1, 10).getValues().map(r => ({
    ticket_id: String(r[0]),
    id: String(r[0]),
    client_name: String(r[1]),
    customer_name: String(r[1]),
    client_email: String(r[2]),
    customer_email: String(r[2]),
    customer_id: String(r[3]),
    subject: String(r[4]),
    priority: String(r[5]),
    status: String(r[6]),
    assigned_to: String(r[7]),
    created_at: String(r[8]),
    updated_at: String(r[9])
  })).filter(t => t.ticket_id);

  if (p.customer_id) list = list.filter(t => t.customer_id === p.customer_id);

  return jr('success', list);
}

// ─── Phase 5: Documents, E-Signatures, & Audit Trail ────────────────

// Security Hash Function (Simple SHA-256 for Apps Script)
function computeHash(input) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  var txtHash = '';
  for (j = 0; j < rawHash.length; j++) {
    var hashVal = rawHash[j];
    if (hashVal < 0) hashVal += 256;
    if (hashVal.toString(16).length == 1) txtHash += "0";
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

function logAudit(docId, userId, userName, userRole, action, metadata) {
  const sheet = getOrCreateSheet('DocumentAuditLogs', HEADERS.DocumentAuditLogs);
  const id = generateId('AUD', 'DocumentAuditLogs', 1);
  const now = getNow();
  sheet.appendRow([
    id, docId, userId||'', userName||'', userRole||'', action, JSON.stringify(metadata||{}), now.date + ' ' + now.time
  ]);
}

function createDocument(d) {
  d = d || {};
  if (!d.title || !d.type || !d.contentHtml) return jr('error', 'Missing required fields.');
  
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet = getOrCreateSheet('Documents', HEADERS.Documents);
    const docId = generateId('DOC', 'Documents', 1);
    
    // Generate Document Number WB-DOC-YYYY-SEQ
    const year = new Date().getFullYear();
    const lastRow = sheet.getLastRow();
    const seq = String(lastRow).padStart(4, '0');
    const docNum = 'WB-DOC-' + year + '-' + seq;
    
    const now = getNow();
    const dt = now.date + ' ' + now.time;
    
    sheet.appendRow([
      docId, d.client_name||'', d.client_email||'', docNum, d.project_id||'', d.client_id||'', d.client_mobile||'',
      d.title, d.type, '1.0', d.contentHtml, 'DRAFT', d.created_by||'', d.created_by_name||'',
      dt, dt, '', '', '', '', '', '', d.expires_at||'', 'FALSE', '', '', '', '', ''
    ]);
    
    logAudit(docId, d.created_by, d.created_by_name, 'Admin', 'DOCUMENT_CREATED', {title: d.title});
    return jr('success', { message: 'Document created.', document_id: docId, documentNumber: docNum });
  } catch (e) {
    return jr('error', 'Failed to create document: ' + e.toString());
  } finally {
    lock.releaseLock();
  }
}

function updateDocument(d) {
  if (!d.document_id) return jr('error', 'Missing document_id');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet = getOrCreateSheet('Documents', HEADERS.Documents);
    const row = findRowByValue(sheet, 1, d.document_id);
    if (row < 2) return jr('error', 'Document not found.');
    
    const status = sheet.getRange(row, 12).getValue();
    if (status !== 'DRAFT') return jr('error', 'Cannot edit a document that is no longer a draft.');
    
    if (d.title) sheet.getRange(row, 8).setValue(d.title);
    if (d.type) sheet.getRange(row, 9).setValue(d.type);
    if (d.contentHtml) sheet.getRange(row, 11).setValue(d.contentHtml);
    if (d.client_name) sheet.getRange(row, 2).setValue(d.client_name);
    if (d.client_email) sheet.getRange(row, 3).setValue(d.client_email);
    if (d.project_id) sheet.getRange(row, 5).setValue(d.project_id);
    if (d.client_id) sheet.getRange(row, 6).setValue(d.client_id);
    if (d.client_mobile) sheet.getRange(row, 7).setValue(d.client_mobile);
    if (d.expires_at) sheet.getRange(row, 23).setValue(d.expires_at);
    
    // Bump version for draft edits
    let ver = parseFloat(sheet.getRange(row, 10).getValue()) || 1.0;
    sheet.getRange(row, 10).setValue((ver + 0.1).toFixed(1));
    sheet.getRange(row, 16).setValue(getNow().date + ' ' + getNow().time); // updated_at
    
    logAudit(d.document_id, d.updated_by, d.updated_by_name, 'Admin', 'DOCUMENT_EDITED', {version: (ver+0.1).toFixed(1)});
    return jr('success', 'Document updated.');
  } finally {
    lock.releaseLock();
  }
}

function requestDocumentSignature(d) {
  if (!d.document_id) return jr('error', 'Missing document_id');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet = getOrCreateSheet('Documents', HEADERS.Documents);
    const row = findRowByValue(sheet, 1, d.document_id);
    if (row < 2) return jr('error', 'Document not found.');
    
    let status = sheet.getRange(row, 12).getValue();
    if (status === 'SIGNED' || status === 'CANCELLED') return jr('error', 'Document cannot be sent.');
    
    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = computeHash(otp);
    const expiresAt = new Date(new Date().getTime() + 15 * 60000).toISOString(); // 15 mins
    const now = getNow();
    const dt = now.date + ' ' + now.time;
    
    const verifSheet = getOrCreateSheet('DocumentVerification', HEADERS.DocumentVerification);
    const verifRow = findRowByValue(verifSheet, 2, d.document_id);
    
    if (verifRow > 1) {
      verifSheet.getRange(verifRow, 5).setValue(otpHash);
      verifSheet.getRange(verifRow, 6).setValue(expiresAt);
      verifSheet.getRange(verifRow, 8).setValue(0); // reset failed attempts
      verifSheet.getRange(verifRow, 9).setValue(''); // clear locked
      verifSheet.getRange(verifRow, 12).setValue(dt);
    } else {
      const vId = generateId('VER', 'DocumentVerification', 1);
      verifSheet.appendRow([
        vId, d.document_id, String(sheet.getRange(row, 6).getValue()), '', otpHash, expiresAt, '', 0, '', '', dt, dt
      ]);
    }
    
    sheet.getRange(row, 12).setValue('PENDING_SIGNATURE');
    sheet.getRange(row, 17).setValue(dt); // sentAt
    
    logAudit(d.document_id, d.sent_by, d.sent_by_name, 'Admin', 'OTP_GENERATED_AND_SENT', {status: 'PENDING_SIGNATURE'});
    return jr('success', { message: 'OTP Generated successfully.', document_id: d.document_id, otp: otp });
  } catch (e) {
    return jr('error', 'Failed to generate OTP: ' + e.toString());
  } finally {
    lock.releaseLock();
  }
}

function verifyDocumentOtp(d) {
  if (!d.document_id || !d.otp) return jr('error', 'Missing document_id or OTP');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const verifSheet = getOrCreateSheet('DocumentVerification', HEADERS.DocumentVerification);
    const row = findRowByValue(verifSheet, 2, d.document_id);
    if (row < 2) return jr('error', 'No active verification found.');
    
    const lockedUntil = verifSheet.getRange(row, 9).getValue();
    if (lockedUntil && new Date() < new Date(lockedUntil)) {
        return jr('error', 'Too many failed attempts. Try again later.');
    }
    
    const storedHash = String(verifSheet.getRange(row, 5).getValue());
    const expiresAt = new Date(verifSheet.getRange(row, 6).getValue());
    const attempts = parseInt(verifSheet.getRange(row, 8).getValue() || 0);
    const now = new Date();
    
    if (now > expiresAt) return jr('error', 'Verification code has expired.');
    
    if (computeHash(String(d.otp)) !== storedHash) {
      let newAttempts = attempts + 1;
      verifSheet.getRange(row, 8).setValue(newAttempts);
      if (newAttempts >= 5) {
        let lockTime = new Date(now.getTime() + 15 * 60000).toISOString();
        verifSheet.getRange(row, 9).setValue(lockTime);
        logAudit(d.document_id, d.client_id, 'Client', 'Client', 'VERIFICATION_LOCKED', {});
        return jr('error', 'Too many verification attempts. Locked for 15 minutes.');
      }
      logAudit(d.document_id, d.client_id, 'Client', 'Client', 'OTP_FAILED', {attempts: newAttempts});
      return jr('error', 'Invalid verification code.');
    }
    
    // Verified
    const dt = getNow().date + ' ' + getNow().time;
    verifSheet.getRange(row, 10).setValue(dt);
    logAudit(d.document_id, d.client_id, 'Client', 'Client', 'OTP_VERIFIED', {});
    
    // Update Document Status
    const sheet = getOrCreateSheet('Documents', HEADERS.Documents);
    const docRow = findRowByValue(sheet, 1, d.document_id);
    if (docRow > 1) {
       const status = sheet.getRange(docRow, 12).getValue();
       if (status === 'PENDING_SIGNATURE') {
           sheet.getRange(docRow, 12).setValue('VIEWED');
           sheet.getRange(docRow, 18).setValue(dt); // viewedAt
           logAudit(d.document_id, d.client_id, 'Client', 'Client', 'DOCUMENT_VIEWED', {});
       }
    }
    
    return jr('success', 'Verified successfully.');
  } finally {
    lock.releaseLock();
  }
}

function signDocument(d) {
  if (!d.document_id || !d.signature_data) return jr('error', 'Missing signature data');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const verifSheet = getOrCreateSheet('DocumentVerification', HEADERS.DocumentVerification);
    const vRow = findRowByValue(verifSheet, 2, d.document_id);
    if (vRow < 2) return jr('error', 'Not verified.');
    if (!verifSheet.getRange(vRow, 10).getValue()) return jr('error', 'Document not verified via OTP.');
    
    const sheet = getOrCreateSheet('Documents', HEADERS.Documents);
    const row = findRowByValue(sheet, 1, d.document_id);
    if (row < 2) return jr('error', 'Document not found.');
    
    const status = sheet.getRange(row, 12).getValue();
    if (status === 'SIGNED' || status === 'CANCELLED' || status === 'REJECTED') return jr('error', 'Document is no longer available for signing.');
    
    // Check Expiry
    const expires = sheet.getRange(row, 23).getValue();
    if (expires && new Date() > new Date(expires)) {
        sheet.getRange(row, 12).setValue('EXPIRED');
        return jr('error', 'Document has expired.');
    }
    
    const timeStr = getNow().date + ' ' + getNow().time;
    sheet.getRange(row, 12).setValue('SIGNED');
    sheet.getRange(row, 19).setValue(timeStr); // verifiedAt mapped to signing time for document
    sheet.getRange(row, 20).setValue(timeStr); // signedAt
    sheet.getRange(row, 24).setValue('TRUE'); // signed bool
    sheet.getRange(row, 25).setValue(d.signer_id || sheet.getRange(row, 6).getValue()); // signer id (Col 6: Client ID)
    sheet.getRange(row, 26).setValue(d.signer_name || sheet.getRange(row, 2).getValue()); // signer name (Col 2: Client Name)
    sheet.getRange(row, 27).setValue(d.signer_email || sheet.getRange(row, 3).getValue()); // signer email (Col 3: Client Email)
    sheet.getRange(row, 28).setValue(d.signature_data); // signature base64
    
    logAudit(d.document_id, d.signer_id, d.signer_name, 'Client', 'DOCUMENT_SIGNED', {});
    
    return jr('success', { message: 'Document signed successfully.', document_id: d.document_id });
  } catch (e) {
    return jr('error', 'Failed to sign document: ' + e.toString());
  } finally {
    lock.releaseLock();
  }
}

function rejectDocument(d) {
  if (!d.document_id || !d.reason) return jr('error', 'Reason is required');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet = getOrCreateSheet('Documents', HEADERS.Documents);
    const row = findRowByValue(sheet, 1, d.document_id);
    if (row < 2) return jr('error', 'Document not found.');
    
    const status = sheet.getRange(row, 12).getValue();
    if (status === 'SIGNED') return jr('error', 'Cannot reject a signed document.');
    
    const timeStr = getNow().date + ' ' + getNow().time;
    sheet.getRange(row, 12).setValue('REJECTED');
    sheet.getRange(row, 21).setValue(timeStr); // rejectedAt
    sheet.getRange(row, 22).setValue(d.reason); // rejectionReason
    
    logAudit(d.document_id, d.client_id, 'Client', 'Client', 'DOCUMENT_REJECTED', {reason: d.reason});
    return jr('success', 'Document rejected.');
  } finally {
    lock.releaseLock();
  }
}

function cancelDocument(d) {
  if (!d.document_id) return jr('error', 'Document ID required');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet = getOrCreateSheet('Documents', HEADERS.Documents);
    const row = findRowByValue(sheet, 1, d.document_id);
    if (row < 2) return jr('error', 'Document not found.');
    
    const timeStr = getNow().date + ' ' + getNow().time;
    sheet.getRange(row, 12).setValue('CANCELLED');
    logAudit(d.document_id, d.admin_id, 'Admin', 'Admin', 'DOCUMENT_CANCELLED', {});
    return jr('success', 'Document cancelled.');
  } finally {
    lock.releaseLock();
  }
}

function getDocuments(p) {
  p = p || {};
  const sheet = getOrCreateSheet('Documents', HEADERS.Documents);
  const last = sheet.getLastRow();
  if (last < 2) return jr('success', []);
  
  let list = sheet.getRange(2, 1, last - 1, 29).getValues().map(r => ({
    document_id: String(r[0]),
    id: String(r[0]),
    client_name: String(r[1]),
    customer_name: String(r[1]),
    client_email: String(r[2]),
    customer_email: String(r[2]),
    document_number: String(r[3]),
    project_id: String(r[4]),
    client_id: String(r[5]),
    client_mobile: String(r[6]),
    title: String(r[7]),
    type: String(r[8]),
    version: String(r[9]),
    contentHtml: p.include_content ? String(r[10]) : '', // Don't fetch content unless needed
    status: String(r[11]),
    created_by: String(r[12]),
    created_by_name: String(r[13]),
    created_at: String(r[14]),
    updated_at: String(r[15]),
    sent_at: String(r[16]),
    viewed_at: String(r[17]),
    verified_at: String(r[18]),
    signed_at: String(r[19]),
    rejected_at: String(r[20]),
    rejection_reason: String(r[21]),
    expires_at: String(r[22]),
    signed: String(r[23]) === 'TRUE',
    signer_id: String(r[24]),
    signer_name: String(r[25]),
    signer_email: String(r[26]),
    signature_data: p.include_content ? String(r[27]) : '',
    final_document_url: String(r[28])
  })).filter(t => t.document_id);

  if (p.project_id) list = list.filter(t => t.project_id === p.project_id);
  if (p.client_id) list = list.filter(t => t.client_id === p.client_id);
  if (p.document_id) {
    list = list.filter(t => t.document_id === p.document_id);
    if (list.length > 0) return jr('success', list[0]); // Return single object if by ID
    return jr('error', 'Document not found.');
  }

  return jr('success', list);
}

function getDocumentAuditLogs(p) {
  if (!p.document_id) return jr('error', 'Document ID required');
  const sheet = getOrCreateSheet('DocumentAuditLogs', HEADERS.DocumentAuditLogs);
  const last = sheet.getLastRow();
  if (last < 2) return jr('success', []);
  
  let list = sheet.getRange(2, 1, last - 1, 8).getValues().map(r => ({
    id: String(r[0]),
    document_id: String(r[1]),
    user_id: String(r[2]),
    user_name: String(r[3]),
    user_role: String(r[4]),
    action: String(r[5]),
    metadata: String(r[6]),
    created_at: String(r[7])
  })).filter(t => t.document_id === p.document_id);
  
  return jr('success', list);
}

function syncLegacyUser(u){
  u = u || {};
  const sheet = getOrCreateSheet(SHEETS.USERS, HEADERS.Users);
  const email = String(u.email || '').trim().toLowerCase();
  if (!email) return jr('error', 'Email required for user sync.');
  const row = findRowByValue(sheet, U.EMAIL, email);
  const now = getNow();
  if(row > 0){
    if(u.full_name) sheet.getRange(row, U.NAME).setValue(u.full_name);
    if(u.mobile) sheet.getRange(row, U.MOBILE).setValue(u.mobile);
    if(u.role) sheet.getRange(row, U.ROLE).setValue(normalizeRole(u.role));
    if(u.is_active !== undefined) sheet.getRange(row, U.STATUS).setValue(u.is_active ? 'ACTIVE' : 'INACTIVE');
    sheet.getRange(row, U.UPD_DATE).setValue(now.date);
    sheet.getRange(row, U.UPD_TIME).setValue(now.time);
    return jr('success', { message: 'User synced (updated).', email: email });
  } else {
    const id = u.id || u.user_id || generateId('USR', SHEETS.USERS, U.ID);
    sheet.appendRow([
      id,
      u.full_name || 'User',
      email,
      u.mobile || '',
      u.password ? hashPassword(u.password) : (u.password_hash || hashPassword('User@1234')),
      normalizeRole(u.role || 'User'),
      u.is_active === false ? 'INACTIVE' : 'ACTIVE',
      now.date,
      now.time,
      '', '', '', '',
      now.date,
      now.time,
      u.assigned_staff_id || ''
    ]);
    return jr('success', { message: 'User synced (created).', id: id, email: email });
  }
}

function syncProject(d) {
  d = d || {};
  const lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch(e) {}
  try {
    const sheet = getOrCreateSheet(SHEETS.PROJECTS, HEADERS.Projects);
    const projId = d.project_id || d.id || generateProjectId();
    const row = findRowByValue(sheet, P.ID, projId);
    const now = getNow();
    
    let clientName = d.client_name || d.customer_name || '';
    let clientEmail = d.client_email || d.customer_email || '';
    if ((!clientName || !clientEmail) && d.customer_id) {
      try {
        const uSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(SHEETS.USERS);
        if (uSheet) {
          const uRows = uSheet.getDataRange().getValues();
          for (let i = 1; i < uRows.length; i++) {
            if (String(uRows[i][0]).trim() === String(d.customer_id).trim()) {
              if (!clientName) clientName = String(uRows[i][1] || '');
              if (!clientEmail) clientEmail = String(uRows[i][2] || '');
              break;
            }
          }
        }
      } catch(e) {}
    }

    if (row > 0) {
      if (clientName) sheet.getRange(row, P.CUST_NAME).setValue(clientName);
      if (clientEmail) sheet.getRange(row, P.CUST_EMAIL).setValue(clientEmail);
      if (d.customer_id) sheet.getRange(row, P.CUST_ID).setValue(d.customer_id);
      if (d.project_name || d.name) sheet.getRange(row, P.PROJ_NAME).setValue(d.project_name || d.name);
      if (d.description !== undefined) sheet.getRange(row, P.DESC).setValue(d.description);
      if (d.stage) sheet.getRange(row, P.STAGE).setValue(d.stage);
      if (d.progress !== undefined) sheet.getRange(row, P.PROGRESS).setValue(parseInt(d.progress) || 0);
      if (d.expected_delivery || d.expected_delivery_date) sheet.getRange(row, P.DELIVERY).setValue(d.expected_delivery || d.expected_delivery_date);
      if (d.status) sheet.getRange(row, P.STATUS).setValue(d.status);
      if (d.latest_update) sheet.getRange(row, P.LATEST_UPDATE).setValue(d.latest_update);
      sheet.getRange(row, P.UPD_DATE).setValue(now.date);
      sheet.getRange(row, P.UPD_TIME).setValue(now.time);
      return jr('success', { project_id: projId, message: 'Project synced (updated).' });
    } else {
      sheet.appendRow([
        projId,
        clientName,
        clientEmail,
        d.customer_id || '',
        (d.project_name || d.name || 'Untitled Project').trim(),
        (d.description || '').trim(),
        d.stage || 'Planning',
        parseInt(d.progress || 0),
        d.expected_delivery || d.expected_delivery_date || '',
        d.status || 'Active',
        d.created_by || '',
        now.date,
        now.time,
        now.date,
        now.time,
        d.latest_update || ''
      ]);
      if (d.staff_id) assignStaff({ project_id: projId, staff_id: d.staff_id, staff_name: d.staff_name || '', assigned_by: d.created_by || '' });
      return jr('success', { project_id: projId, message: 'Project synced (created).' });
    }
  } catch(err) {
    return jr('error', 'syncProject failed: ' + err.toString());
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function syncTask(d) {
  d = d || {};
  const lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch(e) {}
  try {
    const sheet = getOrCreateSheet(SHEETS.TASKS, HEADERS.Tasks);
    const taskId = d.task_id || d.id || generateTaskId();
    const row = findRowByValue(sheet, T.ID, taskId);
    const now = getNow();

    let clientName = d.client_name || d.customer_name || '';
    let clientEmail = d.client_email || d.customer_email || '';
    let projName = d.project_name || '';
    const projId = d.project_id || '';
    if (projId && (!clientName || !clientEmail || !projName)) {
      const pSheet = getOrCreateSheet(SHEETS.PROJECTS, HEADERS.Projects);
      const pRow = findRowByValue(pSheet, P.ID, projId);
      if (pRow > 0) {
        if (!projName) projName = String(pSheet.getRange(pRow, P.PROJ_NAME).getValue() || '');
        if (!clientName) clientName = String(pSheet.getRange(pRow, P.CUST_NAME).getValue() || '');
        if (!clientEmail) clientEmail = String(pSheet.getRange(pRow, P.CUST_EMAIL).getValue() || '');
      }
    }

    let staffName = d.assigned_staff_name || d.staff_name || '';
    const staffId = d.assigned_staff_id !== undefined ? d.assigned_staff_id : (d.staff_id !== undefined ? d.staff_id : '');
    if (!staffName && staffId) {
      const uSheet = getOrCreateSheet(SHEETS.USERS, HEADERS.Users);
      const uRow = findRowByValue(uSheet, U.ID, staffId);
      if (uRow > 0) staffName = String(uSheet.getRange(uRow, U.NAME).getValue() || '');
    }

    if (row > 0) {
      if (clientName) sheet.getRange(row, T.CLIENT_NAME).setValue(clientName);
      if (clientEmail) sheet.getRange(row, T.CLIENT_EMAIL).setValue(clientEmail);
      if (projId) sheet.getRange(row, T.PROJ_ID).setValue(projId);
      if (projName) sheet.getRange(row, T.PROJ_NAME).setValue(projName);
      if (d.title) sheet.getRange(row, T.TITLE).setValue(d.title.trim());
      if (d.description !== undefined) sheet.getRange(row, T.DESC).setValue(d.description);
      if (staffId !== undefined) sheet.getRange(row, T.STAFF_ID).setValue(staffId);
      if (staffName) sheet.getRange(row, T.STAFF_NAME).setValue(staffName);
      if (d.priority) sheet.getRange(row, T.PRIORITY).setValue(d.priority);
      if (d.status) sheet.getRange(row, T.STATUS).setValue(d.status);
      if (d.due_date !== undefined) sheet.getRange(row, T.DUE_DATE).setValue(d.due_date);
      sheet.getRange(row, T.UPD_DATE).setValue(now.date);
      sheet.getRange(row, T.UPD_TIME).setValue(now.time);
      return jr('success', { task_id: taskId, message: 'Task synced (updated).' });
    } else {
      sheet.appendRow([
        taskId,
        clientName,
        clientEmail,
        projId,
        projName,
        (d.title || d.name || 'Untitled Task').trim(),
        (d.description || '').trim(),
        staffId || '',
        staffName || '',
        d.priority || 'Normal',
        d.status || 'Pending',
        d.due_date || '',
        d.created_by || '',
        now.date,
        now.time,
        now.date,
        now.time
      ]);
      return jr('success', { task_id: taskId, message: 'Task synced (created).' });
    }
  } catch(err) {
    return jr('error', 'syncTask failed: ' + err.toString());
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function syncMeeting(d) {
  d = d || {};
  const lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch(e) {}
  try {
    const sheet = getOrCreateSheet(SHEETS.MEETINGS, HEADERS.Meetings);
    const meetId = d.meeting_id || d.id || generateId('MT', SHEETS.MEETINGS, MT.ID);
    const row = findRowByValue(sheet, MT.ID, meetId);
    const now = getNow();
    
    let clientName = d.client_name || d.customer_name || '';
    let clientEmail = d.client_email || d.customer_email || '';
    if ((!clientName || !clientEmail) && d.customer_id) {
      try {
        const uSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(SHEETS.USERS);
        if (uSheet) {
          const uRows = uSheet.getDataRange().getValues();
          for (let i = 1; i < uRows.length; i++) {
            if (String(uRows[i][0]).trim() === String(d.customer_id).trim()) {
              if (!clientName) clientName = String(uRows[i][1] || '');
              if (!clientEmail) clientEmail = String(uRows[i][2] || '');
              break;
            }
          }
        }
      } catch(e) {}
    }

    if (row > 0) {
      if (clientName) sheet.getRange(row, MT.CLIENT_NAME).setValue(clientName);
      if (clientEmail) sheet.getRange(row, MT.CLIENT_EMAIL).setValue(clientEmail);
      if (d.project_id) sheet.getRange(row, MT.PROJ_ID).setValue(d.project_id);
      if (d.customer_id) sheet.getRange(row, MT.CUST_ID).setValue(d.customer_id);
      if (d.staff_id) sheet.getRange(row, MT.STAFF_ID).setValue(d.staff_id);
      if (d.title) sheet.getRange(row, MT.TITLE).setValue(d.title);
      if (d.date) sheet.getRange(row, MT.DATE).setValue(d.date);
      if (d.time) sheet.getRange(row, MT.TIME).setValue(d.time);
      if (d.meet_link) sheet.getRange(row, MT.MEET_LINK).setValue(d.meet_link);
      if (d.status) sheet.getRange(row, MT.STATUS).setValue(d.status);
      return jr('success', { meeting_id: meetId, message: 'Meeting synced (updated).' });
    } else {
      sheet.appendRow([
        meetId,
        clientName,
        clientEmail,
        d.project_id || '',
        d.customer_id || '',
        d.staff_id || '',
        d.title || 'Project Consultation',
        d.date || now.date,
        d.time || now.time,
        d.meet_link || 'https://meet.google.com/new',
        d.status || 'SCHEDULED',
        now.date + ' ' + now.time
      ]);
      return jr('success', { meeting_id: meetId, message: 'Meeting synced (created).' });
    }
  } catch(err) {
    return jr('error', 'syncMeeting failed: ' + err.toString());
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function syncInvoice(d) {
  d = d || {};
  const lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch(e) {}
  try {
    const sheet = getOrCreateSheet(SHEETS.INVOICES, HEADERS.Invoices);
    const invId = d.invoice_id || d.id || ('INV-' + Utilities.getUuid().slice(0, 8).toUpperCase());
    const row = findRowByValue(sheet, 1, invId);
    const now = getNow();
    
    let clientName = d.client_name || d.customer_name || '';
    let clientEmail = d.client_email || d.customer_email || '';
    if ((!clientName || !clientEmail) && d.customer_id) {
      try {
        const uSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(SHEETS.USERS);
        if (uSheet) {
          const uRows = uSheet.getDataRange().getValues();
          for (let i = 1; i < uRows.length; i++) {
            if (String(uRows[i][0]).trim() === String(d.customer_id).trim()) {
              if (!clientName) clientName = String(uRows[i][1] || '');
              if (!clientEmail) clientEmail = String(uRows[i][2] || '');
              break;
            }
          }
        }
      } catch(e) {}
    }

    if (row > 0) {
      if (clientName) sheet.getRange(row, 2).setValue(clientName);
      if (clientEmail) sheet.getRange(row, 3).setValue(clientEmail);
      if (d.project_id) sheet.getRange(row, 4).setValue(d.project_id);
      if (d.project_name) sheet.getRange(row, 5).setValue(d.project_name);
      if (d.customer_id) sheet.getRange(row, 6).setValue(d.customer_id);
      if (d.amount !== undefined) sheet.getRange(row, 7).setValue(d.amount);
      if (d.gst_amount !== undefined) sheet.getRange(row, 8).setValue(d.gst_amount);
      if (d.total_amount !== undefined) sheet.getRange(row, 9).setValue(d.total_amount);
      if (d.status) sheet.getRange(row, 10).setValue(d.status);
      if (d.due_date) sheet.getRange(row, 11).setValue(d.due_date);
      if (d.paid_at) sheet.getRange(row, 12).setValue(d.paid_at);
      if (d.order_id) sheet.getRange(row, 13).setValue(d.order_id);
      if (d.payment_id) sheet.getRange(row, 14).setValue(d.payment_id);
      sheet.getRange(row, 16).setValue(now.date + ' ' + now.time);
      return jr('success', { invoice_id: invId, message: 'Invoice synced (updated).' });
    } else {
      sheet.appendRow([
        invId,
        clientName,
        clientEmail,
        d.project_id || '',
        d.project_name || '',
        d.customer_id || '',
        d.amount || 0,
        d.gst_amount || Math.round((d.amount || 0) * 0.18),
        d.total_amount || d.amount || 0,
        d.status || 'UNPAID',
        d.due_date || '',
        d.paid_at || '',
        d.order_id || '',
        d.payment_id || '',
        now.date + ' ' + now.time,
        now.date + ' ' + now.time
      ]);
      return jr('success', { invoice_id: invId, message: 'Invoice synced (created).' });
    }
  } catch(err) {
    return jr('error', 'syncInvoice failed: ' + err.toString());
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

// ─────────────── MESSAGING SYSTEM ────────────────────────────
function getMessageColMap(sheet){
  const fallback = Object.assign({}, M);
  const lastCol = sheet.getLastColumn();
  if (sheet.getLastRow() < 1 || lastCol < 1) return fallback;
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const colMap = {};
  headers.forEach((h, idx) => {
    const raw = String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!raw) return;
    const col1 = idx + 1;
    if (raw === 'messageid' || raw === 'id') colMap.ID = col1;
    else if (raw === 'conversationid' || raw === 'convid') colMap.CONV_ID = col1;
    else if (raw === 'senderid') colMap.SENDER_ID = col1;
    else if (raw === 'sendername') colMap.SENDER_NAME = col1;
    else if (raw === 'senderrole') colMap.SENDER_ROLE = col1;
    else if (raw === 'receiverid' || raw === 'recvid') colMap.RECV_ID = col1;
    else if (raw === 'receivername' || raw === 'recvname') colMap.RECV_NAME = col1;
    else if (raw === 'receiverrole' || raw === 'recvrole') colMap.RECV_ROLE = col1;
    else if (raw === 'projectid') colMap.PROJ_ID = col1;
    else if (raw === 'customerid') colMap.CUST_ID = col1;
    else if (raw === 'subject') colMap.SUBJECT = col1;
    else if (raw === 'message' || raw === 'body') colMap.BODY = col1;
    else if (raw === 'status') colMap.STATUS = col1;
    else if (raw === 'readat') colMap.READ_AT = col1;
    else if (raw === 'createddate') colMap.CREATED_DATE = col1;
    else if (raw === 'createdtime') colMap.CREATED_TIME = col1;
    else if (raw === 'lastupdated') colMap.UPDATED = col1;
    else if (raw === 'deletedbysender') colMap.DEL_SENDER = col1;
    else if (raw === 'deletedbyreceiver') colMap.DEL_RECV = col1;
    else if (raw === 'deleteddate') colMap.DEL_DATE = col1;
    else if (raw === 'deletedtime') colMap.DEL_TIME = col1;
  });
  return Object.assign({}, fallback, colMap, { TOTAL: Math.max(lastCol, M.TOTAL) });
}

function sendMessage(d) {
  d = d || {};
  const msgText = d.body || d.message || '';
  const senderId = String(d.sender_id || '');
  let receiverId = String(d.receiver_id || d.recipient_id || '');

  if (!senderId || !msgText) {
    return jr('error', 'Sender and message body are required.');
  }

  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet = getOrCreateSheet(SHEETS.MESSAGES, HEADERS.Messages);
    const colMap = getMessageColMap(sheet);
    let convId = d.conversation_id || '';

    // If receiver_id not provided but conversation_id is, try to resolve receiver from existing conversation
    if (!receiverId && convId) {
      const lastM = sheet.getLastRow();
      if (lastM >= 2) {
        const rows = sheet.getRange(2, 1, lastM - 1, Math.max(sheet.getLastColumn(), colMap.TOTAL || M.TOTAL)).getValues();
        for (let i = rows.length - 1; i >= 0; i--) {
          const r = rows[i];
          const rConvId = String(r[(colMap.CONV_ID || M.CONV_ID) - 1] || '');
          if (rConvId === String(convId)) {
            const sId = String(r[(colMap.SENDER_ID || M.SENDER_ID) - 1] || '');
            const rcId = String(r[(colMap.RECV_ID || M.RECV_ID) - 1] || '');
            receiverId = (sId === senderId) ? rcId : sId;
            if (receiverId) break;
          }
        }
      }
    }

    const uSheet = getOrCreateSheet(SHEETS.USERS, HEADERS.Users);
    const sRow = findRowByValue(uSheet, U.ID, senderId);
    const rRow = receiverId ? findRowByValue(uSheet, U.ID, receiverId) : -1;
    
    const senderRole = (sRow > 0) ? normalizeRole(uSheet.getRange(sRow, U.ROLE).getValue()) : (d.sender_role || 'Admin');
    const recvRole = (rRow > 0) ? normalizeRole(uSheet.getRange(rRow, U.ROLE).getValue()) : (d.receiver_role || 'User');
    const senderName = (sRow > 0) ? uSheet.getRange(sRow, U.NAME).getValue() : (d.sender_name || 'Sender');
    const recvName = (rRow > 0) ? uSheet.getRange(rRow, U.NAME).getValue() : (d.receiver_name || d.recipient_name || 'Receiver');

    if (senderRole === 'User' && recvRole === 'User' && receiverId && receiverId !== senderId) {
      return jr('error', 'Clients cannot message other clients.');
    }

    const msgId = generateId('MSG', SHEETS.MESSAGES, colMap.ID || M.ID);
    if (!convId) {
      if (receiverId) convId = findExistingConversation(senderId, receiverId);
      if (!convId) convId = generateConvId();
    }
    
    const now = getNow();
    const maxCols = Math.max(sheet.getLastColumn(), HEADERS.Messages.length);
    const newRow = new Array(maxCols).fill('');
    
    if (colMap.ID) newRow[colMap.ID-1] = msgId;
    if (colMap.CONV_ID) newRow[colMap.CONV_ID-1] = convId;
    if (colMap.SENDER_ID) newRow[colMap.SENDER_ID-1] = senderId;
    if (colMap.SENDER_NAME) newRow[colMap.SENDER_NAME-1] = senderName;
    if (colMap.SENDER_ROLE) newRow[colMap.SENDER_ROLE-1] = senderRole;
    if (colMap.RECV_ID) newRow[colMap.RECV_ID-1] = receiverId || '0';
    if (colMap.RECV_NAME) newRow[colMap.RECV_NAME-1] = recvName;
    if (colMap.RECV_ROLE) newRow[colMap.RECV_ROLE-1] = recvRole;
    if (colMap.PROJ_ID) newRow[colMap.PROJ_ID-1] = d.project_id || '';
    if (colMap.CUST_ID) newRow[colMap.CUST_ID-1] = d.customer_id || '';
    if (colMap.SUBJECT) newRow[colMap.SUBJECT-1] = d.subject || 'Direct Message';
    if (colMap.BODY) newRow[colMap.BODY-1] = msgText;
    if (colMap.STATUS) newRow[colMap.STATUS-1] = 'UNREAD';
    if (colMap.CREATED_DATE) newRow[colMap.CREATED_DATE-1] = now.date;
    if (colMap.CREATED_TIME) newRow[colMap.CREATED_TIME-1] = now.time;
    if (colMap.UPDATED) newRow[colMap.UPDATED-1] = now.date + ' ' + now.time;

    sheet.appendRow(newRow);
    return jr('success', { status: 'success', message: 'Message sent successfully', message_id: msgId, conversation_id: convId, data: { message_id: msgId, conversation_id: convId } });
  } finally { lock.releaseLock(); }
}

function getMessages(p) {
  p = p || {};
  if (!p.user_id) return jr('error', 'User ID required.');
  const sheet = getOrCreateSheet(SHEETS.MESSAGES, HEADERS.Messages);
  const colMap = getMessageColMap(sheet);
  const last = sheet.getLastRow();
  if (last < 2) return jr('success', []);
  const totalCols = Math.max(sheet.getLastColumn(), colMap.TOTAL || M.TOTAL);
  const rawRows = sheet.getRange(2, 1, last - 1, totalCols).getValues();
  
  let messages = rawRows.map(r => {
    return {
      message_id: String(r[colMap.ID-1]||''),
      conversation_id: String(r[colMap.CONV_ID-1]||''),
      sender_id: String(r[colMap.SENDER_ID-1]||''),
      sender_name: String(r[colMap.SENDER_NAME-1]||''),
      sender_role: String(r[colMap.SENDER_ROLE-1]||''),
      receiver_id: String(r[colMap.RECV_ID-1]||''),
      receiver_name: String(r[colMap.RECV_NAME-1]||''),
      receiver_role: String(r[colMap.RECV_ROLE-1]||''),
      project_id: String(r[colMap.PROJ_ID-1]||''),
      customer_id: String(r[colMap.CUST_ID-1]||''),
      subject: String(r[colMap.SUBJECT-1]||''),
      message: String(r[colMap.BODY-1]||''),
      status: String(r[colMap.STATUS-1]||''),
      read_at: String(r[colMap.READ_AT-1]||''),
      created_date: String(r[colMap.CREATED_DATE-1]||''),
      created_time: String(r[colMap.CREATED_TIME-1]||''),
      deleted_by_sender: String(r[colMap.DEL_SENDER-1]||'').toUpperCase() === 'TRUE',
      deleted_by_receiver: String(r[colMap.DEL_RECV-1]||'').toUpperCase() === 'TRUE'
    };
  }).filter(m => m.message_id);

  messages = messages.filter(m => {
    if (m.sender_id === p.user_id && !m.deleted_by_sender) return true;
    if (m.receiver_id === p.user_id && !m.deleted_by_receiver) return true;
    return false;
  });

  if (p.conversation_id) messages = messages.filter(m => m.conversation_id === p.conversation_id);
  if (p.type === 'inbox') messages = messages.filter(m => m.receiver_id === p.user_id);
  if (p.type === 'sent') messages = messages.filter(m => m.sender_id === p.user_id);
  if (p.status) messages = messages.filter(m => m.status.toLowerCase() === p.status.toLowerCase());

  return jr('success', messages);
}

function getConversationThread(p) {
  p = p || {};
  if (!p.conversation_id || !p.user_id) return jr('error', 'Conversation ID and User ID required.');
  
  const msgsReq = JSON.parse(getMessages({ user_id: p.user_id, conversation_id: p.conversation_id }).getContent());
  if (msgsReq.status !== 'success') return jr('error', msgsReq.message);
  
  const messages = msgsReq.data;
  messages.sort((a, b) => {
    const timeA = new Date(a.created_date.split('-').reverse().join('-') + 'T' + a.created_time);
    const timeB = new Date(b.created_date.split('-').reverse().join('-') + 'T' + b.created_time);
    return timeA - timeB;
  });
  return jr('success', messages);
}

function getConversations(p) {
  p = p || {};
  if (!p.user_id) return jr('error', 'User ID required.');
  const msgsReq = JSON.parse(getMessages(p).getContent());
  if (msgsReq.status !== 'success') return jr('error', msgsReq.message);
  
  const messages = msgsReq.data;
  const convMap = {};
  
  messages.forEach(m => {
    if (!convMap[m.conversation_id]) {
      convMap[m.conversation_id] = {
        conversation_id: m.conversation_id,
        participant_id: m.sender_id === p.user_id ? m.receiver_id : m.sender_id,
        participant_name: m.sender_id === p.user_id ? m.receiver_name : m.sender_name,
        participant_role: m.sender_id === p.user_id ? m.receiver_role : m.sender_role,
        project_id: m.project_id,
        customer_id: m.customer_id,
        latest_message: m,
        unread_count: 0,
        messages: []
      };
    }
    const c = convMap[m.conversation_id];
    c.messages.push(m);
    if (m.receiver_id === p.user_id && m.status.toUpperCase() === 'UNREAD') {
      c.unread_count++;
    }
    if (m.created_date + ' ' + m.created_time > c.latest_message.created_date + ' ' + c.latest_message.created_time) {
      c.latest_message = m;
    }
  });

  return jr('success', Object.values(convMap).sort((a,b) => {
    const timeA = new Date(a.latest_message.created_date.split('-').reverse().join('-') + 'T' + a.latest_message.created_time);
    const timeB = new Date(b.latest_message.created_date.split('-').reverse().join('-') + 'T' + b.latest_message.created_time);
    return timeB - timeA;
  }));
}

function markMessageRead(d) {
  d = d || {};
  if (!d.message_id && !d.conversation_id) return jr('error', 'Message ID or Conversation ID required.');
  if (!d.user_id) return jr('error', 'User ID required.');
  
  const sheet = getOrCreateSheet(SHEETS.MESSAGES, HEADERS.Messages);
  const colMap = getMessageColMap(sheet);
  const last = sheet.getLastRow();
  if (last < 2) return jr('success', { message: 'No messages to update' });
  
  const rawRows = sheet.getRange(2, 1, last - 1, Math.max(sheet.getLastColumn(), colMap.TOTAL || M.TOTAL)).getValues();
  const now = getNow();
  let updatedCount = 0;
  
  rawRows.forEach((r, idx) => {
    const rowNum = idx + 2;
    const msgId = String(r[colMap.ID-1]||'');
    const convId = String(r[colMap.CONV_ID-1]||'');
    const recvId = String(r[colMap.RECV_ID-1]||'');
    const status = String(r[colMap.STATUS-1]||'').toUpperCase();
    
    if (recvId === d.user_id && status === 'UNREAD') {
      if ((d.message_id && msgId === d.message_id) || (d.conversation_id && convId === d.conversation_id)) {
        sheet.getRange(rowNum, colMap.STATUS).setValue('READ');
        if (colMap.READ_AT) sheet.getRange(rowNum, colMap.READ_AT).setValue(now.date + ' ' + now.time);
        updatedCount++;
      }
    }
  });
  
  return jr('success', { message: `Marked ${updatedCount} messages as read.` });
}

function deleteMessageForMe(d) {
  d = d || {};
  if (!d.message_id || !d.user_id) return jr('error', 'Message ID and User ID required.');
  const sheet = getOrCreateSheet(SHEETS.MESSAGES, HEADERS.Messages);
  const colMap = getMessageColMap(sheet);
  const row = findRowByValue(sheet, colMap.ID || M.ID, d.message_id);
  if (row < 0) return jr('error', 'Message not found.');
  
  const senderId = String(sheet.getRange(row, colMap.SENDER_ID).getValue());
  const recvId = String(sheet.getRange(row, colMap.RECV_ID).getValue());
  const now = getNow();
  
  if (d.user_id === senderId) {
    if (colMap.DEL_SENDER) sheet.getRange(row, colMap.DEL_SENDER).setValue('TRUE');
  } else if (d.user_id === recvId) {
    if (colMap.DEL_RECV) sheet.getRange(row, colMap.DEL_RECV).setValue('TRUE');
  } else {
    return jr('error', 'Not authorized to delete this message.');
  }
  
  if (colMap.DEL_DATE) sheet.getRange(row, colMap.DEL_DATE).setValue(now.date);
  if (colMap.DEL_TIME) sheet.getRange(row, colMap.DEL_TIME).setValue(now.time);
  
  return jr('success', { message: 'Message deleted for you.' });
}

function deleteConversationForMe(d) {
  d = d || {};
  if (!d.conversation_id || !d.user_id) return jr('error', 'Conversation ID and User ID required.');
  const sheet = getOrCreateSheet(SHEETS.MESSAGES, HEADERS.Messages);
  const colMap = getMessageColMap(sheet);
  const last = sheet.getLastRow();
  if (last < 2) return jr('success', { message: 'No messages found.' });
  
  const rawRows = sheet.getRange(2, 1, last - 1, Math.max(sheet.getLastColumn(), colMap.TOTAL || M.TOTAL)).getValues();
  const now = getNow();
  let updatedCount = 0;
  
  rawRows.forEach((r, idx) => {
    const rowNum = idx + 2;
    const convId = String(r[colMap.CONV_ID-1]||'');
    if (convId === d.conversation_id) {
      const senderId = String(r[colMap.SENDER_ID-1]||'');
      const recvId = String(r[colMap.RECV_ID-1]||'');
      let changed = false;
      if (d.user_id === senderId) {
        if (colMap.DEL_SENDER) { sheet.getRange(rowNum, colMap.DEL_SENDER).setValue('TRUE'); changed = true; }
      }
      if (d.user_id === recvId) {
        if (colMap.DEL_RECV) { sheet.getRange(rowNum, colMap.DEL_RECV).setValue('TRUE'); changed = true; }
      }
      if (changed) {
        if (colMap.DEL_DATE) sheet.getRange(rowNum, colMap.DEL_DATE).setValue(now.date);
        if (colMap.DEL_TIME) sheet.getRange(rowNum, colMap.DEL_TIME).setValue(now.time);
        updatedCount++;
      }
    }
  });
  
  return jr('success', { message: `Deleted ${updatedCount} messages in conversation for you.` });
}

function searchMessages(p) {
  p = p || {};
  if (!p.user_id || !p.query) return jr('error', 'User ID and search query required.');
  const msgsReq = JSON.parse(getMessages(p).getContent());
  if (msgsReq.status !== 'success') return jr('error', msgsReq.message);
  
  const q = p.query.toLowerCase();
  const results = msgsReq.data.filter(m => {
    return (m.message && m.message.toLowerCase().includes(q)) ||
           (m.subject && m.subject.toLowerCase().includes(q)) ||
           (m.sender_name && m.sender_name.toLowerCase().includes(q)) ||
           (m.receiver_name && m.receiver_name.toLowerCase().includes(q)) ||
           (m.project_id && m.project_id.toLowerCase().includes(q)) ||
           (m.conversation_id && m.conversation_id.toLowerCase().includes(q));
  });
  return jr('success', results);
}

function getMessageStats(p) {
  p = p || {};
  if (!p.user_id) return jr('error', 'User ID required.');
  const msgsReq = JSON.parse(getMessages(p).getContent());
  if (msgsReq.status !== 'success') return jr('error', msgsReq.message);
  
  let inboxCount = 0;
  let unreadCount = 0;
  let sentCount = 0;
  const convSet = new Set();
  
  msgsReq.data.forEach(m => {
    convSet.add(m.conversation_id);
    if (m.receiver_id === p.user_id) {
      inboxCount++;
      if (m.status.toUpperCase() === 'UNREAD') unreadCount++;
    }
    if (m.sender_id === p.user_id) {
      sentCount++;
    }
  });
  
  return jr('success', {
    inbox: inboxCount,
    unread: unreadCount,
    sent: sentCount,
    conversations: convSet.size
  });
}



// ─────────────── UTILITIES ────────────────────────────────────
function hashPassword(password,salt){
  if(!salt)salt=Utilities.getUuid().replace(/-/g,'').substring(0,16);
  const digest=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,salt+password,Utilities.Charset.UTF_8);
  const hash=digest.map(b=>('0'+(b&0xFF).toString(16)).slice(-2)).join('');
  return 'SHA256:'+salt+':'+hash;
}

function verifyPassword(password,stored){
  if(!stored||!password) return false;
  if(!stored.startsWith('SHA256:')) return false;
  const parts=stored.split(':');if(parts.length!==3) return false;
  return hashPassword(password,parts[1])===stored;
}

function generateId(prefix,sheetName,idCol){
  const year=new Date().getFullYear();const pfx=prefix+'-'+year+'-';
  const sheet=getOrCreateSheet(sheetName,HEADERS[sheetName]||[]);const last=sheet.getLastRow();let max=0;
  if(last>=2){sheet.getRange(2,idCol,last-1,1).getValues().forEach(r=>{const id=String(r[0]);if(id.startsWith(pfx)){const n=parseInt(id.substring(pfx.length),10);if(!isNaN(n)&&n>max)max=n;}});}
  return pfx+('000000'+(max+1)).slice(-6);
}

function generateProjectId(){
  const year=new Date().getFullYear();const pfx='WB-'+year+'-';
  const sheet=getOrCreateSheet(SHEETS.PROJECTS,HEADERS.Projects);const last=sheet.getLastRow();let max=0;
  if(last>=2){sheet.getRange(2,P.ID,last-1,1).getValues().forEach(r=>{const id=String(r[0]);if(id.startsWith(pfx)){const n=parseInt(id.substring(pfx.length),10);if(!isNaN(n)&&n>max)max=n;}});}
  return pfx+('000'+(max+1)).slice(-3);
}

function generateConvId(){return 'CONV-'+new Date().getFullYear()+'-'+('000000'+(Math.max(0,getOrCreateSheet(SHEETS.MESSAGES,HEADERS.Messages).getLastRow()-1)+1)).slice(-6);}

function findExistingConversation(sid,rid){
  const sheet=getOrCreateSheet(SHEETS.MESSAGES,HEADERS.Messages);const last=sheet.getLastRow();if(last<2)return null;
  const rows=sheet.getRange(2,1,last-1,M.TOTAL).getValues();
  for(let i=rows.length-1;i>=0;i--){const r=rows[i];const rs=String(r[M.SENDER_ID-1]);const rr=String(r[M.RECV_ID-1]);if((rs===sid&&rr===rid)||(rs===rid&&rr===sid)){const c=String(r[M.CONV_ID-1]);if(c)return c;}}
  return null;
}

function findRowByValue(sheet,col,value){
  const last=sheet.getLastRow();if(last<2)return -1;
  const vals=sheet.getRange(2,col,last-1,1).getValues();
  for(let i=0;i<vals.length;i++){if(String(vals[i][0]).toLowerCase()===String(value).toLowerCase())return i+2;}
  return -1;
}

function getOrCreateSheet(sheetName,headers){
  const ss=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);let sheet=ss.getSheetByName(sheetName);
  if(!sheet){sheet=ss.insertSheet(sheetName);if(headers&&headers.length){sheet.getRange(1,1,1,headers.length).setValues([headers]);sheet.setFrozenRows(1);sheet.getRange(1,1,1,headers.length).setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold');}}
  return sheet;
}

function getNow(){const tz=CONFIG.TIMEZONE;const now=new Date();return{date:Utilities.formatDate(now,tz,'dd-MM-yyyy'),time:Utilities.formatDate(now,tz,'HH:mm:ss'),iso:now.toISOString()};}
function normalizeRole(r){const m={'super admin':'Super Admin','superadmin':'Super Admin','super_admin':'Super Admin','admin':'Admin','staff':'Staff','user':'User','client':'User','customer':'User'};return m[String(r).toLowerCase()]||r;}
function jr(status,data){const o={status};if(status==='success')o.data=data;else o.message=data;return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function cleanTrigger(tid){PropertiesService.getScriptProperties().deleteProperty('trigger_'+tid);ScriptApp.getProjectTriggers().forEach(t=>{if(t.getUniqueId()===tid)ScriptApp.deleteTrigger(t);});}

function buildEmailTemplate(name,id,msg){return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;background:#f1f5f9;}.wrapper{max-width:620px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.12);}.header{background:linear-gradient(135deg,#1d4ed8,#7c3aed);padding:40px;text-align:center;color:#fff;font-size:26px;font-weight:800;}.body{padding:40px;}.cta-btn{display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff!important;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;}.footer{background:#0f172a;padding:28px;text-align:center;color:#64748b;font-size:12px;}</style></head><body><div class="wrapper"><div class="header">Website <span style="color:#34d399;">Builders</span></div><div class="body"><h2>Thank You, ${name}!</h2><p style="margin:16px 0;">Your enquiry <strong>${id}</strong> has been received. We'll respond within 24–48 hours.</p><p style="margin:16px 0;"><em>"${msg.length>80?msg.substring(0,80)+'...':msg}"</em></p><div style="text-align:center;margin:32px 0;"><a href="${CONFIG.BUSINESS_WEBSITE}" class="cta-btn">Visit Our Website</a></div></div><div class="footer">© ${new Date().getFullYear()} Website Builders • ${CONFIG.BUSINESS_WEBSITE}</div></div></body></html>`;}


function getRecipients(p) {
  p = p || {};
  const uid = String(p.user_id || '');
  const sheet = getOrCreateSheet(SHEETS.USERS, HEADERS.Users);
  const last = sheet.getLastRow();
  if (last < 2) return jr('success', []);
  
  const allUsers = sheet.getRange(2, 1, last - 1, U.TOTAL).getValues().map(r => userRowToDict(r)).filter(u => u.user_id && u.is_active);
  const caller = allUsers.find(u => String(u.user_id) === uid);
  
  const role = String((caller && caller.role) || p.role || '').toLowerCase();
  const assignedStaff = String((caller && caller.assigned_staff_id) || '');
  
  const r = [];
  
  if (role === 'super admin' || role === 'admin' || role === 'super_admin') {
    allUsers.filter(u => String(u.user_id) !== uid).forEach(u => r.push({
      id: String(u.user_id),
      user_id: String(u.user_id),
      name: u.full_name,
      full_name: u.full_name,
      email: u.email,
      role: u.role
    }));
  } else if (role === 'staff') {
    allUsers.filter(u => String(u.user_id) !== uid).forEach(u => {
      r.push({
        id: String(u.user_id),
        user_id: String(u.user_id),
        name: u.full_name,
        full_name: u.full_name,
        email: u.email,
        role: u.role
      });
    });
  } else {
    // Client / User: Can message Admins, Super Admins, and Staff (Assigned or any staff if unassigned)
    allUsers.forEach(u => {
      if (String(u.user_id) === uid) return;
      const uRole = String(u.role || '').toLowerCase();
      if (uRole === 'admin' || uRole === 'super admin' || uRole === 'super_admin') {
        r.push({
          id: String(u.user_id),
          user_id: String(u.user_id),
          name: u.full_name,
          full_name: u.full_name,
          email: u.email,
          role: u.role
        });
      } else if (uRole === 'staff') {
        if (!assignedStaff || String(u.user_id) === assignedStaff) {
          r.push({
            id: String(u.user_id),
            user_id: String(u.user_id),
            name: u.full_name,
            full_name: u.full_name,
            email: u.email,
            role: u.role
          });
        }
      }
    });
  }
  
  return jr('success', r);
}

// ─────────────── PAYMENTS & INVOICES ──────────────────────────
function logPayment(d) {
  d = d || {};
  const lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch(e) {}
  try {
    const paySheet = getOrCreateSheet(SHEETS.PAYMENTS, HEADERS.Payments);
    const id = d.payment_id || ('PAY-' + Utilities.getUuid().slice(0, 8).toUpperCase());
    const now = getNow();
    const paidAt = d.paid_at || (now.date + ' ' + now.time);
    
    let clientName = d.client_name || d.customer_name || '';
    let clientEmail = d.client_email || d.customer_email || '';
    if ((!clientName || !clientEmail) && d.customer_id) {
      try {
        const uSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(SHEETS.USERS);
        if (uSheet) {
          const uRows = uSheet.getDataRange().getValues();
          for (let i = 1; i < uRows.length; i++) {
            if (String(uRows[i][0]).trim() === String(d.customer_id).trim()) {
              if (!clientName) clientName = String(uRows[i][1] || '');
              if (!clientEmail) clientEmail = String(uRows[i][2] || '');
              break;
            }
          }
        }
      } catch(e) {}
    }
    
    // 1. Append to Payments Sheet (1: ID, 2: Client Name, 3: Client Email, ...)
    paySheet.appendRow([
      id,
      clientName,
      clientEmail,
      d.order_id || '',
      d.payment_id || id,
      d.invoice_id || '',
      d.customer_id || '',
      d.amount || 0,
      d.currency || 'INR',
      d.status || 'PAID',
      d.signature || '',
      paidAt
    ]);

    // 2. Sync to Invoices Sheet
    try {
      const invSheet = getOrCreateSheet(SHEETS.INVOICES, HEADERS.Invoices);
      const invRows = invSheet.getDataRange().getValues();
      let found = false;
      const targetInvId = String(d.invoice_id || '').trim();
      if (targetInvId) {
        for (let i = 1; i < invRows.length; i++) {
          if (String(invRows[i][0]).trim() === targetInvId) {
            invSheet.getRange(i + 1, 10).setValue('PAID');
            invSheet.getRange(i + 1, 12).setValue(paidAt);
            invSheet.getRange(i + 1, 13).setValue(d.order_id || '');
            invSheet.getRange(i + 1, 14).setValue(d.payment_id || id);
            invSheet.getRange(i + 1, 16).setValue(now.date + ' ' + now.time);
            found = true;
            break;
          }
        }
      }
      if (!found && targetInvId) {
        invSheet.appendRow([
          targetInvId,
          clientName || d.customer_name || 'Client',
          clientEmail || d.customer_email || '',
          d.project_id || '',
          d.project_name || d.description || 'Milestone Settlement',
          d.customer_id || '',
          d.amount || 0,
          Math.round((d.amount || 0) * 0.18),
          d.amount || 0,
          'PAID',
          now.date,
          paidAt,
          d.order_id || '',
          d.payment_id || id,
          now.date + ' ' + now.time,
          now.date + ' ' + now.time
        ]);
      }
    } catch(invErr) {
      Logger.log('Invoice sync error: ' + invErr.toString());
    }

    // 3. Log Activity
    try {
      logActivity({
        userId: d.customer_id || '',
        userName: clientName || d.customer_name || 'Client',
        role: 'Client',
        action: 'PAYMENT_RECEIVED',
        relatedId: id,
        description: 'Payment of ' + (d.currency || 'INR') + ' ' + (d.amount || 0) + ' confirmed via Razorpay (' + (d.payment_id || id) + ')',
        status: 'SUCCESS'
      });
    } catch(actErr) {}

    return jr('success', { payment_id: id, invoice_id: d.invoice_id || '' });
  } catch(err) {
    return jr('error', 'Payment logging failed: ' + err.toString());
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function getPayments(p) {
  p = p || {};
  try {
    const sheet = getOrCreateSheet(SHEETS.PAYMENTS, HEADERS.Payments);
    const last = sheet.getLastRow();
    if (last < 2) return jr('success', []);
    const rows = sheet.getRange(2, 1, last - 1, 12).getValues();
    let list = rows.map(r => ({
      payment_id: String(r[0]),
      client_name: String(r[1]),
      customer_name: String(r[1]),
      client_email: String(r[2]),
      customer_email: String(r[2]),
      order_id: String(r[3]),
      gateway_payment_id: String(r[4]),
      invoice_id: String(r[5]),
      customer_id: String(r[6]),
      amount: Number(r[7]) || 0,
      currency: String(r[8]),
      status: String(r[9]),
      signature: String(r[10] || ''),
      paid_at: String(r[11] || '')
    })).filter(x => x.payment_id);

    if (p.customer_id) list = list.filter(x => x.customer_id === p.customer_id);
    return jr('success', list.reverse());
  } catch(err) {
    return jr('error', 'Failed to retrieve payments: ' + err.toString());
  }
}

function createInvoice(d) {
  d = d || {};
  const lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch(e) {}
  try {
    const sheet = getOrCreateSheet(SHEETS.INVOICES, HEADERS.Invoices);
    const now = getNow();
    const id = d.invoice_id || ('INV-' + Utilities.getUuid().slice(0, 8).toUpperCase());
    let clientName = d.client_name || d.customer_name || '';
    let clientEmail = d.client_email || d.customer_email || '';
    if ((!clientName || !clientEmail) && d.customer_id) {
      try {
        const uSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(SHEETS.USERS);
        if (uSheet) {
          const uRows = uSheet.getDataRange().getValues();
          for (let i = 1; i < uRows.length; i++) {
            if (String(uRows[i][0]).trim() === String(d.customer_id).trim()) {
              if (!clientName) clientName = String(uRows[i][1] || '');
              if (!clientEmail) clientEmail = String(uRows[i][2] || '');
              break;
            }
          }
        }
      } catch(e) {}
    }
    // Standard schema: 1: ID, 2: Client Name, 3: Client Email, 4: Project ID, 5: Project Name, 6: Customer ID, ...
    sheet.appendRow([
      id,
      clientName,
      clientEmail,
      d.project_id || '',
      d.project_name || '',
      d.customer_id || '',
      d.amount || 0,
      d.gst_amount || 0,
      d.total_amount || d.amount || 0,
      d.status || 'UNPAID',
      d.due_date || '',
      d.paid_at || '',
      d.order_id || '',
      d.payment_id || '',
      now.date + ' ' + now.time,
      now.date + ' ' + now.time
    ]);
    return jr('success', { invoice_id: id });
  } catch(err) {
    return jr('error', 'Invoice creation failed: ' + err.toString());
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function getInvoices(p) {
  p = p || {};
  try {
    const sheet = getOrCreateSheet(SHEETS.INVOICES, HEADERS.Invoices);
    const last = sheet.getLastRow();
    if (last < 2) return jr('success', []);
    const rows = sheet.getRange(2, 1, last - 1, 16).getValues();
    let list = rows.map(r => ({
      invoice_id: String(r[0]),
      client_name: String(r[1]),
      customer_name: String(r[1]),
      client_email: String(r[2]),
      customer_email: String(r[2]),
      project_id: String(r[3]),
      project_name: String(r[4]),
      customer_id: String(r[5]),
      amount: Number(r[6]) || 0,
      gst_amount: Number(r[7]) || 0,
      total_amount: Number(r[8]) || 0,
      status: String(r[9]),
      due_date: String(r[10]),
      paid_at: String(r[11]),
      order_id: String(r[12] || ''),
      payment_id: String(r[13] || ''),
      created_date: String(r[14])
    })).filter(x => x.invoice_id);

    if (p.customer_id) list = list.filter(x => x.customer_id === p.customer_id);
    return jr('success', list.reverse());
  } catch(err) {
    return jr('error', 'Failed to retrieve invoices: ' + err.toString());
  }
}


// =======================================================
// NEW ENTITIES FUNCTIONS
// =======================================================

function createStageHistory(d) {
  d = d || {};
  const sheet = getOrCreateSheet(SHEETS.STAGE_HISTORY, HEADERS.StageHistory);
  const id = generateId('SH', SHEETS.STAGE_HISTORY, SH.ID);
  const now = getNow();
  let clientName = d.client_name || d.clientName || d.customer_name || '';
  let clientEmail = d.client_email || d.clientEmail || d.customer_email || '';
  if ((!clientName || !clientEmail) && d.project_id) {
    try {
      const pSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(SHEETS.PROJECTS);
      if (pSheet) {
        const pRow = findRowByValue(pSheet, P.ID, d.project_id);
        if (pRow > 0) {
          if (!clientName) clientName = String(pSheet.getRange(pRow, P.CUST_NAME).getValue() || '');
          if (!clientEmail) clientEmail = String(pSheet.getRange(pRow, P.CUST_EMAIL).getValue() || '');
        }
      }
    } catch(e) {}
  }
  sheet.appendRow([
    id,
    d.project_id || '',
    clientName,
    clientEmail,
    d.old_stage || d.oldStage || '',
    d.new_stage || d.newStage || '',
    d.changed_by || d.changedBy || '',
    now.date + ' ' + now.time,
    d.remarks || ''
  ]);
  return jr('success', {id: id});
}
function getStageHistory(p) {
  p = p || {};
  const sheet = getOrCreateSheet(SHEETS.STAGE_HISTORY, HEADERS.StageHistory);
  const rows = sheet.getDataRange().getValues();
  let res = [];
  for(let i=1; i<rows.length; i++) {
    if(p.project_id && String(rows[i][SH.PROJ_ID-1]) !== String(p.project_id)) continue;
    res.push({
      id: rows[i][SH.ID-1],
      project_id: rows[i][SH.PROJ_ID-1],
      client_name: rows[i][SH.CLIENT_NAME-1] || '',
      clientName: rows[i][SH.CLIENT_NAME-1] || '',
      client_email: rows[i][SH.CLIENT_EMAIL-1] || '',
      clientEmail: rows[i][SH.CLIENT_EMAIL-1] || '',
      old_stage: rows[i][SH.OLD_STAGE-1],
      new_stage: rows[i][SH.NEW_STAGE-1],
      changed_by: rows[i][SH.CHANGED_BY-1],
      timestamp: rows[i][SH.TIMESTAMP-1],
      remarks: rows[i][SH.REMARKS-1]
    });
  }
  return jr('success', res);
}

function createLead(d) {
  const sheet = getOrCreateSheet(SHEETS.LEADS, HEADERS.Leads);
  const id = generateId('LD', SHEETS.LEADS, LD.ID);
  const now = getNow();
  const dt = now.date + ' ' + now.time;
  sheet.appendRow([id, d.name||'', d.email||'', d.phone||'', d.company||'', d.status||'New', d.source||'', d.assigned_to||'', dt, dt]);
  return jr('success', {id: id});
}
function updateLead(d) {
  const sheet = getOrCreateSheet(SHEETS.LEADS, HEADERS.Leads);
  const row = findRowByValue(sheet, LD.ID, d.id);
  if (row === -1) return jr('error', 'Lead not found');
  const now = getNow();
  const dt = now.date + ' ' + now.time;
  if(d.name) sheet.getRange(row, LD.NAME).setValue(d.name);
  if(d.email) sheet.getRange(row, LD.EMAIL).setValue(d.email);
  if(d.phone) sheet.getRange(row, LD.PHONE).setValue(d.phone);
  if(d.company) sheet.getRange(row, LD.COMPANY).setValue(d.company);
  if(d.status) sheet.getRange(row, LD.STATUS).setValue(d.status);
  if(d.source) sheet.getRange(row, LD.SOURCE).setValue(d.source);
  if(d.assigned_to) sheet.getRange(row, LD.ASSIGNED_TO).setValue(d.assigned_to);
  sheet.getRange(row, LD.UPDATED_AT).setValue(dt);
  return jr('success', {id: d.id});
}
function getLeads(p) {
  const sheet = getOrCreateSheet(SHEETS.LEADS, HEADERS.Leads);
  const rows = sheet.getDataRange().getValues();
  let res = [];
  for(let i=1; i<rows.length; i++) {
    if(p.status && rows[i][LD.STATUS-1] !== p.status) continue;
    res.push({
      id: rows[i][LD.ID-1], name: rows[i][LD.NAME-1], email: rows[i][LD.EMAIL-1],
      phone: rows[i][LD.PHONE-1], company: rows[i][LD.COMPANY-1], status: rows[i][LD.STATUS-1],
      source: rows[i][LD.SOURCE-1], assigned_to: rows[i][LD.ASSIGNED_TO-1],
      created_at: rows[i][LD.CREATED_AT-1], updated_at: rows[i][LD.UPDATED_AT-1]
    });
  }
  return jr('success', res);
}

function createLeadNote(d) {
  const sheet = getOrCreateSheet(SHEETS.LEAD_NOTES, HEADERS.LeadNotes);
  const id = generateId('LN', SHEETS.LEAD_NOTES, LN.ID);
  const now = getNow();
  const dt = now.date + ' ' + now.time;
  sheet.appendRow([id, d.lead_id||'', d.user_id||'', d.note||'', dt]);
  return jr('success', {id: id});
}
function getLeadNotes(p) {
  const sheet = getOrCreateSheet(SHEETS.LEAD_NOTES, HEADERS.LeadNotes);
  const rows = sheet.getDataRange().getValues();
  let res = [];
  for(let i=1; i<rows.length; i++) {
    if(p.lead_id && String(rows[i][LN.LEAD_ID-1]) !== String(p.lead_id)) continue;
    res.push({
      id: rows[i][LN.ID-1], lead_id: rows[i][LN.LEAD_ID-1],
      user_id: rows[i][LN.USER_ID-1], note: rows[i][LN.NOTE-1], created_at: rows[i][LN.CREATED_AT-1]
    });
  }
  return jr('success', res);
}

function createPortfolio(d) {
  const sheet = getOrCreateSheet(SHEETS.PORTFOLIO, HEADERS.Portfolio);
  const id = generateId('PT', SHEETS.PORTFOLIO, PT.ID);
  const now = getNow();
  const dt = now.date + ' ' + now.time;
  sheet.appendRow([id, d.title||'', d.desc||'', d.image||'', d.link||'', d.category||'', d.sort_order||0, dt]);
  return jr('success', {id: id});
}
function updatePortfolio(d) {
  const sheet = getOrCreateSheet(SHEETS.PORTFOLIO, HEADERS.Portfolio);
  const row = findRowByValue(sheet, PT.ID, d.id);
  if(row === -1) return jr('error', 'Portfolio not found');
  if(d.title) sheet.getRange(row, PT.TITLE).setValue(d.title);
  if(d.desc) sheet.getRange(row, PT.DESC).setValue(d.desc);
  if(d.image) sheet.getRange(row, PT.IMAGE).setValue(d.image);
  if(d.link) sheet.getRange(row, PT.LINK).setValue(d.link);
  if(d.category) sheet.getRange(row, PT.CATEGORY).setValue(d.category);
  if(d.sort_order !== undefined) sheet.getRange(row, PT.SORT_ORDER).setValue(d.sort_order);
  return jr('success', {id: d.id});
}
function getPortfolio(p) {
  const sheet = getOrCreateSheet(SHEETS.PORTFOLIO, HEADERS.Portfolio);
  const rows = sheet.getDataRange().getValues();
  let res = [];
  for(let i=1; i<rows.length; i++) {
    res.push({
      id: rows[i][PT.ID-1], title: rows[i][PT.TITLE-1], desc: rows[i][PT.DESC-1],
      image: rows[i][PT.IMAGE-1], link: rows[i][PT.LINK-1], category: rows[i][PT.CATEGORY-1],
      sort_order: rows[i][PT.SORT_ORDER-1], created_at: rows[i][PT.CREATED_AT-1]
    });
  }
  return jr('success', res);
}

function createPricing(d) {
  const sheet = getOrCreateSheet(SHEETS.PRICING, HEADERS.Pricing);
  const id = generateId('PR', SHEETS.PRICING, PR.ID);
  const now = getNow();
  const dt = now.date + ' ' + now.time;
  sheet.appendRow([id, d.name||'', d.desc||'', d.price||0, d.features||'', d.status||'ACTIVE', dt, dt]);
  return jr('success', {id: id});
}
function updatePricing(d) {
  const sheet = getOrCreateSheet(SHEETS.PRICING, HEADERS.Pricing);
  const row = findRowByValue(sheet, PR.ID, d.id);
  if(row === -1) return jr('error', 'Pricing not found');
  const now = getNow();
  const dt = now.date + ' ' + now.time;
  if(d.name) sheet.getRange(row, PR.NAME).setValue(d.name);
  if(d.desc) sheet.getRange(row, PR.DESC).setValue(d.desc);
  if(d.price !== undefined) sheet.getRange(row, PR.PRICE).setValue(d.price);
  if(d.features) sheet.getRange(row, PR.FEATURES).setValue(d.features);
  if(d.status) sheet.getRange(row, PR.STATUS).setValue(d.status);
  sheet.getRange(row, PR.UPDATED_AT).setValue(dt);
  return jr('success', {id: d.id});
}
function getPricing(p) {
  const sheet = getOrCreateSheet(SHEETS.PRICING, HEADERS.Pricing);
  const rows = sheet.getDataRange().getValues();
  let res = [];
  for(let i=1; i<rows.length; i++) {
    res.push({
      id: rows[i][PR.ID-1], name: rows[i][PR.NAME-1], desc: rows[i][PR.DESC-1],
      price: rows[i][PR.PRICE-1], features: rows[i][PR.FEATURES-1], status: rows[i][PR.STATUS-1],
      created_at: rows[i][PR.CREATED_AT-1], updated_at: rows[i][PR.UPDATED_AT-1]
    });
  }
  return jr('success', res);
}

function createNotification(d) {
  const sheet = getOrCreateSheet(SHEETS.NOTIFICATIONS, HEADERS.Notifications);
  const id = generateId('NT', SHEETS.NOTIFICATIONS, NT.ID);
  const now = getNow();
  const dt = now.date + ' ' + now.time;
  sheet.appendRow([id, d.user_id||'', d.title||'', d.message||'', d.link||'', 'FALSE', dt]);
  return jr('success', {id: id});
}
function markNotificationRead(d) {
  const sheet = getOrCreateSheet(SHEETS.NOTIFICATIONS, HEADERS.Notifications);
  const row = findRowByValue(sheet, NT.ID, d.id);
  if(row === -1) return jr('error', 'Notification not found');
  sheet.getRange(row, NT.IS_READ).setValue('TRUE');
  return jr('success', {id: d.id});
}
function getNotifications(p) {
  const sheet = getOrCreateSheet(SHEETS.NOTIFICATIONS, HEADERS.Notifications);
  const rows = sheet.getDataRange().getValues();
  let res = [];
  for(let i=1; i<rows.length; i++) {
    if(p.user_id && String(rows[i][NT.USER_ID-1]) !== String(p.user_id)) continue;
    res.push({
      id: rows[i][NT.ID-1], user_id: rows[i][NT.USER_ID-1], title: rows[i][NT.TITLE-1],
      message: rows[i][NT.MESSAGE-1], link: rows[i][NT.LINK-1], is_read: rows[i][NT.IS_READ-1],
      created_at: rows[i][NT.CREATED_AT-1]
    });
  }
  return jr('success', res);
}

function createPasswordReset(d) {
  const sheet = getOrCreateSheet(SHEETS.PASSWORD_RESETS, HEADERS.PasswordResets);
  const id = generateId('PW', SHEETS.PASSWORD_RESETS, PW.ID);
  const now = getNow();
  const dt = now.date + ' ' + now.time;
  sheet.appendRow([id, d.user_id||'', d.token||'', d.expires_at||'', 'FALSE', dt]);
  return jr('success', {id: id});
}
function usePasswordReset(d) {
  const sheet = getOrCreateSheet(SHEETS.PASSWORD_RESETS, HEADERS.PasswordResets);
  const rows = sheet.getDataRange().getValues();
  let row = -1;
  for(let i=1; i<rows.length; i++) {
    if(rows[i][PW.TOKEN-1] === d.token) { row = i+1; break; }
  }
  if(row === -1) return jr('error', 'Token not found');
  sheet.getRange(row, PW.USED).setValue('TRUE');
  return jr('success', {id: rows[row-2][PW.ID-1], user_id: rows[row-2][PW.USER_ID-1]});
}
function getPasswordResets(p) {
  const sheet = getOrCreateSheet(SHEETS.PASSWORD_RESETS, HEADERS.PasswordResets);
  const rows = sheet.getDataRange().getValues();
  let res = [];
  for(let i=1; i<rows.length; i++) {
    if(p.token && rows[i][PW.TOKEN-1] !== p.token) continue;
    res.push({
      id: rows[i][PW.ID-1], user_id: rows[i][PW.USER_ID-1], token: rows[i][PW.TOKEN-1],
      expires_at: rows[i][PW.EXPIRES_AT-1], used: rows[i][PW.USED-1], created_at: rows[i][PW.CREATED_AT-1]
    });
  }
  return jr('success', res);
}

function createEmailVerification(d) {
  const sheet = getOrCreateSheet(SHEETS.EMAIL_VERIFICATIONS, HEADERS.EmailVerifications);
  const id = generateId('EV', SHEETS.EMAIL_VERIFICATIONS, EV.ID);
  const now = getNow();
  const dt = now.date + ' ' + now.time;
  sheet.appendRow([id, d.user_id||'', d.token||'', d.expires_at||'', 'FALSE', dt]);
  return jr('success', {id: id});
}
function useEmailVerification(d) {
  const sheet = getOrCreateSheet(SHEETS.EMAIL_VERIFICATIONS, HEADERS.EmailVerifications);
  const rows = sheet.getDataRange().getValues();
  let row = -1;
  for(let i=1; i<rows.length; i++) {
    if(rows[i][EV.TOKEN-1] === d.token) { row = i+1; break; }
  }
  if(row === -1) return jr('error', 'Token not found');
  sheet.getRange(row, EV.VERIFIED).setValue('TRUE');
  return jr('success', {id: rows[row-2][EV.ID-1], user_id: rows[row-2][EV.USER_ID-1]});
}
function getEmailVerifications(p) {
  const sheet = getOrCreateSheet(SHEETS.EMAIL_VERIFICATIONS, HEADERS.EmailVerifications);
  const rows = sheet.getDataRange().getValues();
  let res = [];
  for(let i=1; i<rows.length; i++) {
    if(p.token && rows[i][EV.TOKEN-1] !== p.token) continue;
    res.push({
      id: rows[i][EV.ID-1], user_id: rows[i][EV.USER_ID-1], token: rows[i][EV.TOKEN-1],
      expires_at: rows[i][EV.EXPIRES_AT-1], verified: rows[i][EV.VERIFIED-1], created_at: rows[i][EV.CREATED_AT-1]
    });
  }
  return jr('success', res);
}

// ─── Brand Info ────────────────────────────────
function createBrandInfo(d) {
  d = d || {};
  const sheet = getOrCreateSheet('BrandInfo', HEADERS.BrandInfo);
  const id = generateId('BI', 'BrandInfo', 1);
  const now = getNow();
  const dt = now.date + ' ' + now.time;
  let clientName = d.client_name || d.customer_name || '';
  let clientEmail = d.client_email || d.customer_email || '';
  if ((!clientName || !clientEmail) && d.user_id) {
    try {
      const uSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(SHEETS.USERS);
      if (uSheet) {
        const uRows = uSheet.getDataRange().getValues();
        for (let i = 1; i < uRows.length; i++) {
          if (String(uRows[i][0]).trim() === String(d.user_id).trim()) {
            if (!clientName) clientName = String(uRows[i][1] || '');
            if (!clientEmail) clientEmail = String(uRows[i][2] || '');
            break;
          }
        }
      }
    } catch(e) {}
  }
  sheet.appendRow([
    id,
    clientName,
    clientEmail,
    d.user_id || '',
    d.brand_name || '',
    d.tagline || '',
    d.primary_color || '',
    d.secondary_color || '',
    d.font_family || '',
    d.target_audience || '',
    d.competitors || '',
    d.brand_values || '',
    d.assets_url || '',
    dt
  ]);
  return jr('success', {id: id});
}

function updateBrandInfo(d) {
  if(!d.id) return jr('error', 'Brand ID required');
  const sheet = getOrCreateSheet('BrandInfo', HEADERS.BrandInfo);
  const rows = sheet.getDataRange().getValues();
  let row = -1;
  for(let i=1; i<rows.length; i++) {
    if(rows[i][0] === d.id) { row = i+1; break; }
  }
  if(row === -1) return jr('error', 'Brand not found');
  
  if(d.client_name!==undefined) sheet.getRange(row, 2).setValue(d.client_name);
  if(d.client_email!==undefined) sheet.getRange(row, 3).setValue(d.client_email);
  if(d.brand_name!==undefined) sheet.getRange(row, 5).setValue(d.brand_name);
  if(d.tagline!==undefined) sheet.getRange(row, 6).setValue(d.tagline);
  if(d.primary_color!==undefined) sheet.getRange(row, 7).setValue(d.primary_color);
  if(d.secondary_color!==undefined) sheet.getRange(row, 8).setValue(d.secondary_color);
  if(d.font_family!==undefined) sheet.getRange(row, 9).setValue(d.font_family);
  if(d.target_audience!==undefined) sheet.getRange(row, 10).setValue(d.target_audience);
  if(d.competitors!==undefined) sheet.getRange(row, 11).setValue(d.competitors);
  if(d.brand_values!==undefined) sheet.getRange(row, 12).setValue(d.brand_values);
  if(d.assets_url!==undefined) sheet.getRange(row, 13).setValue(d.assets_url);
  
  const now = getNow();
  sheet.getRange(row, 14).setValue(now.date + ' ' + now.time);
  return jr('success', 'Updated');
}

function getBrandInfo(p) {
  const sheet = getOrCreateSheet('BrandInfo', HEADERS.BrandInfo);
  const last = sheet.getLastRow();
  if (last < 2) return jr('success', []);
  const list = sheet.getRange(2, 1, last - 1, 14).getValues().map(r => ({
    id: String(r[0]),
    client_name: String(r[1]),
    customer_name: String(r[1]),
    client_email: String(r[2]),
    customer_email: String(r[2]),
    user_id: String(r[3]),
    brand_name: String(r[4]),
    tagline: String(r[5]),
    primary_color: String(r[6]),
    secondary_color: String(r[7]),
    font_family: String(r[8]),
    target_audience: String(r[9]),
    competitors: String(r[10]),
    brand_values: String(r[11]),
    assets_url: String(r[12]),
    updated_at: String(r[13])
  })).filter(t => t.id);
  return jr('success', list);
}

// ─── Documents update ────────────────────────────────
function updateDocument(d) {
  if(!d.document_id) return jr('error', 'Document ID required');
  const sheet = getOrCreateSheet('Documents', HEADERS.Documents);
  const rows = sheet.getDataRange().getValues();
  let row = -1;
  for(let i=1; i<rows.length; i++) {
    if(rows[i][0] === d.document_id) { row = i+1; break; }
  }
  if(row === -1) return jr('error', 'Document not found');
  
  if(d.title!==undefined) sheet.getRange(row, 8).setValue(d.title);
  if(d.file_url!==undefined) sheet.getRange(row, 29).setValue(d.file_url);
  if(d.status!==undefined) sheet.getRange(row, 12).setValue(d.status);
  
  return jr('success', 'Updated');
}

// ─── Files ────────────────────────────────
function createFile(d) {
  d = d || {};
  const sheet = getOrCreateSheet(SHEETS.FILES || 'Files', HEADERS.Files);
  const id = generateId('FIL', SHEETS.FILES || 'Files', 1);
  const now = getNow();
  const dt = now.date + ' ' + now.time;
  let clientName = d.client_name || d.customer_name || '';
  let clientEmail = d.client_email || d.customer_email || '';
  if ((!clientName || !clientEmail) && d.customer_id) {
    try {
      const uSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(SHEETS.USERS);
      if (uSheet) {
        const uRows = uSheet.getDataRange().getValues();
        for (let i = 1; i < uRows.length; i++) {
          if (String(uRows[i][0]).trim() === String(d.customer_id).trim()) {
            if (!clientName) clientName = String(uRows[i][1] || '');
            if (!clientEmail) clientEmail = String(uRows[i][2] || '');
            break;
          }
        }
      }
    } catch(e) {}
  }
  sheet.appendRow([
    id,
    clientName,
    clientEmail,
    d.project_id || '',
    d.uploaded_by || '',
    d.file_name || '',
    d.file_url || '',
    d.file_size || '',
    d.file_type || '',
    d.category || 'GENERAL',
    dt
  ]);
  return jr('success', { file_id: id });
}

function getFiles(p) {
  p = p || {};
  try {
    const sheet = getOrCreateSheet(SHEETS.FILES || 'Files', HEADERS.Files);
    const last = sheet.getLastRow();
    if (last < 2) return jr('success', []);
    let list = sheet.getRange(2, 1, last - 1, 11).getValues().map(r => ({
      file_id: String(r[0]),
      client_name: String(r[1]),
      customer_name: String(r[1]),
      client_email: String(r[2]),
      customer_email: String(r[2]),
      project_id: String(r[3]),
      uploaded_by: String(r[4]),
      file_name: String(r[5]),
      file_url: String(r[6]),
      file_size: String(r[7]),
      file_type: String(r[8]),
      category: String(r[9]),
      uploaded_at: String(r[10])
    })).filter(f => f.file_id);
    if (p.project_id) list = list.filter(f => f.project_id === p.project_id);
    return jr('success', list);
  } catch(err) {
    return jr('error', 'Failed to retrieve files: ' + err.toString());
  }
}


// ─── Teams ────────────────────────────────
function createTeam(d) {
  if(!d.team_name || !d.leader_id) return jr('error', 'Team Name and Leader ID are required');
  const sheet = getOrCreateSheet(SHEETS.TEAMS || 'Teams', HEADERS.Teams);
  const id = generateId('TM', 'Teams', 1);
  const now = getNow();
  const dt = now.date + ' ' + now.time;
  sheet.appendRow([id, d.team_name, d.description||'', d.leader_id, d.members||'[]', dt]);
  return jr('success', {id: id});
}

function updateTeam(d) {
  if(!d.team_id) return jr('error', 'Team ID required');
  const sheet = getOrCreateSheet(SHEETS.TEAMS || 'Teams', HEADERS.Teams);
  const rows = sheet.getDataRange().getValues();
  let row = -1;
  for(let i=1; i<rows.length; i++) {
    if(rows[i][0] === d.team_id) { row = i+1; break; }
  }
  if(row === -1) return jr('error', 'Team not found');
  
  if(d.team_name) sheet.getRange(row, 2).setValue(d.team_name);
  if(d.description !== undefined) sheet.getRange(row, 3).setValue(d.description);
  if(d.leader_id) sheet.getRange(row, 4).setValue(d.leader_id);
  if(d.members) sheet.getRange(row, 5).setValue(d.members);
  
  return jr('success', 'Team updated');
}

function deleteTeam(d) {
  d = d || {};
  const teamId = String(d.team_id || d.id || '').trim();
  if(!teamId) return jr('error', 'Team ID required');
  
  const lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch(e) {}
  
  try {
    const sheet = getOrCreateSheet(SHEETS.TEAMS || 'Teams', HEADERS.Teams);
    const rows = sheet.getDataRange().getValues();
    let deletedCount = 0;
    
    for(let i = rows.length - 1; i >= 1; i--) {
      if(String(rows[i][0]).trim().toLowerCase() === teamId.toLowerCase()) {
        sheet.deleteRow(i + 1);
        deletedCount++;
      }
    }
    
    // Also clean up any associated memberships in TeamMembers sheet
    try {
      const tmSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(SHEETS.TEAM_MEMBERS || 'TeamMembers');
      if (tmSheet && tmSheet.getLastRow() >= 2) {
        const tmRows = tmSheet.getDataRange().getValues();
        for (let j = tmRows.length - 1; j >= 1; j--) {
          if (String(tmRows[j][1]).trim().toLowerCase() === teamId.toLowerCase()) {
            tmSheet.deleteRow(j + 1);
          }
        }
      }
    } catch(errTm) {
      Logger.log('Error cleaning team members: ' + errTm.toString());
    }
    
    return jr('success', { message: 'Team deleted successfully', deleted_rows: deletedCount });
  } catch(err) {
    return jr('error', 'deleteTeam failed: ' + err.toString());
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function getTeams(p) {
  const sheet = getOrCreateSheet(SHEETS.TEAMS || 'Teams', HEADERS.Teams);
  const last = sheet.getLastRow();
  if (last < 2) return jr('success', []);
  
  const list = sheet.getRange(2, 1, last - 1, 6).getValues().map(r => ({
    team_id: String(r[0]),
    team_name: String(r[1]),
    description: String(r[2]),
    leader_id: String(r[3]),
    members: String(r[4]),
    created_at: String(r[5])
  })).filter(t => t.team_id);
  
  return jr('success', list);
}

// ─────────────── PASSWORD OTPS (FORGOT PASSWORD) ─────────────
function savePasswordOtp(d) {
  d = d || {};
  if (!d.email || !d.otp_hash) return jr('error', 'Email and OTP hash required.');
  const email = String(d.email).trim().toLowerCase();
  const purpose = d.purpose || 'PASSWORD_RESET';
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getOrCreateSheet(SHEETS.PASSWORD_OTPS, HEADERS.PasswordOTPs);
    const lastRow = sheet.getLastRow();
    
    // Mark previous ACTIVE OTPs for this email and purpose as SUPERSEDED
    if (lastRow >= 2) {
      const values = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
      for (let i = 0; i < values.length; i++) {
        const rowEmail = String(values[i][1]).trim().toLowerCase();
        const rowPurpose = String(values[i][3]);
        const rowStatus = String(values[i][7]);
        if (rowEmail === email && rowPurpose === purpose && rowStatus === 'ACTIVE') {
          sheet.getRange(i + 2, 8).setValue('SUPERSEDED');
        }
      }
    }
    
    const otpId = d.otp_id || generateId('POTP', SHEETS.PASSWORD_OTPS, 1);
    const createdAt = d.created_at || new Date().toISOString();
    const expiresAt = d.expires_at || new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const verifiedAt = '';
    const status = 'ACTIVE';
    const attempts = 0;
    const ipAddress = d.ip_address || '';
    const usedAt = '';
    
    sheet.appendRow([otpId, email, d.otp_hash, purpose, createdAt, expiresAt, verifiedAt, status, attempts, ipAddress, usedAt]);
    return jr('success', { otp_id: otpId, status: 'ACTIVE' });
  } catch(err) {
    return jr('error', 'Failed to save OTP: ' + err.toString());
  } finally {
    lock.releaseLock();
  }
}

function getPasswordOtp(d) {
  d = d || {};
  if (!d.email) return jr('error', 'Email required.');
  const email = String(d.email).trim().toLowerCase();
  const purpose = d.purpose || 'PASSWORD_RESET';
  const sheet = getOrCreateSheet(SHEETS.PASSWORD_OTPS, HEADERS.PasswordOTPs);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return jr('error', 'No active OTP found.');
  
  const values = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  // Search from bottom up for latest active OTP
  for (let i = values.length - 1; i >= 0; i--) {
    const rowEmail = String(values[i][1]).trim().toLowerCase();
    const rowPurpose = String(values[i][3]);
    const rowStatus = String(values[i][7]);
    if (rowEmail === email && rowPurpose === purpose) {
      const expiresAt = new Date(values[i][5]);
      const now = new Date();
      if (rowStatus === 'ACTIVE' && expiresAt < now) {
        sheet.getRange(i + 2, 8).setValue('EXPIRED');
        continue;
      }
      return jr('success', {
        row_index: i + 2,
        otp_id: String(values[i][0]),
        email: rowEmail,
        otp_hash: String(values[i][2]),
        purpose: rowPurpose,
        created_at: String(values[i][4]),
        expires_at: String(values[i][5]),
        verified_at: String(values[i][6]),
        status: rowStatus,
        attempts: Number(values[i][8]) || 0,
        ip_address: String(values[i][9]),
        used_at: String(values[i][10])
      });
    }
  }
  return jr('error', 'No active OTP found.');
}

function updatePasswordOtp(d) {
  d = d || {};
  if (!d.otp_id) return jr('error', 'OTP ID required.');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getOrCreateSheet(SHEETS.PASSWORD_OTPS, HEADERS.PasswordOTPs);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return jr('error', 'OTP record not found.');
    
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    let rowIndex = -1;
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(d.otp_id)) {
        rowIndex = i + 2;
        break;
      }
    }
    if (rowIndex < 0) return jr('error', 'OTP record not found.');
    
    if (d.status !== undefined) sheet.getRange(rowIndex, 8).setValue(d.status);
    if (d.attempts !== undefined) sheet.getRange(rowIndex, 9).setValue(d.attempts);
    if (d.verified_at !== undefined) sheet.getRange(rowIndex, 7).setValue(d.verified_at);
    if (d.used_at !== undefined) sheet.getRange(rowIndex, 11).setValue(d.used_at);
    
    return jr('success', { message: 'OTP updated successfully.' });
  } catch(err) {
    return jr('error', 'Failed to update OTP: ' + err.toString());
  } finally {
    lock.releaseLock();
  }
}

function updateUserPassword(d) {
  d = d || {};
  if (!d.email || !d.new_password) return jr('error', 'Email and new password required.');
  const email = String(d.email).trim().toLowerCase();
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getOrCreateSheet(SHEETS.USERS, HEADERS.Users);
    const row = findRowByValue(sheet, U.EMAIL, email);
    if (row < 0) return jr('error', 'User not found.');
    
    const hashed = hashPassword(d.new_password);
    sheet.getRange(row, U.PASS).setValue(hashed);
    const now = getNow();
    sheet.getRange(row, U.UPD_DATE).setValue(now.date);
    sheet.getRange(row, U.UPD_TIME).setValue(now.time);
    
    const userId = String(sheet.getRange(row, U.ID).getValue());
    logActivity({
      userId: userId,
      userName: String(sheet.getRange(row, U.NAME).getValue()),
      role: String(sheet.getRange(row, U.ROLE).getValue()),
      action: 'PASSWORD_RESET',
      relatedId: userId,
      description: 'Password reset via OTP verification',
      status: 'SUCCESS'
    });
    
    return jr('success', { message: 'Password updated successfully.' });
  } catch(err) {
    return jr('error', 'Failed to update password: ' + err.toString());
  } finally {
    lock.releaseLock();
  }
}

function sendPasswordResetOtpEmail(d) {
  d = d || {};
  const email = String(d.email || '').trim().toLowerCase();
  const otp = String(d.otp || '').trim();
  if (!email || !otp || otp.length !== 6) {
    return jr('error', 'Valid email and 6-digit OTP required.');
  }

  const subject = 'Website Builders - Password Reset OTP';
  const htmlBody = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; margin: 0; padding: 24px; color: #f8fafc; }
  .card { max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); padding: 36px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
  .logo { text-align: center; margin-bottom: 24px; font-size: 24px; font-weight: 800; color: #ffffff; }
  .logo span { color: #22c55e; }
  h2 { color: #ffffff; font-size: 20px; margin-top: 0; margin-bottom: 12px; }
  p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; }
  .otp-box { background: rgba(34, 197, 94, 0.1); border: 2px dashed #22c55e; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
  .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #22c55e; font-family: Courier, monospace; }
  .otp-expiry { font-size: 12px; color: #64748b; margin-top: 6px; }
  .warning-box { background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #fca5a5; margin: 20px 0; }
  .footer { text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #64748b; }
</style>
</head>
<body>
  <div class="card">
    <div class="logo">Website <span>Builders</span></div>
    <h2>Password Reset Verification</h2>
    <p>Hello,</p>
    <p>We received a request to reset the password for your Website Builders account. Use the one-time verification code (OTP) below to proceed:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">Valid for 5 minutes only</div>
    </div>
    <div class="warning-box">
      <strong>Security Notice:</strong> Never share this OTP with anyone. Our staff will never ask for your verification code.
    </div>
    <p>If you did not request a password reset, you can safely ignore this email. Your existing password will remain unchanged.</p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Website Builders &bull; Support: websitebuildeers@gmail.com
    </div>
  </div>
</body>
</html>`;

  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
    return jr('success', { message: 'OTP email sent successfully.' });
  } catch(err) {
    Logger.log('MailApp error: ' + err.toString());
    return jr('error', 'Failed to send email: ' + err.toString());
  }
}



// ═══════════════════════════════════════════════════════════════════
// WORK MANAGEMENT EXTENSIONS (PROJECTS, TEAMS, TASKS, WORK DISTRIBUTION)
// ═══════════════════════════════════════════════════════════════════

function generateTeamId() {
  const year = new Date().getFullYear();
  const pfx = 'TEAM-' + year + '-';
  const sheet = getOrCreateSheet(SHEETS.TEAMS || 'Teams', HEADERS.Teams);
  const last = sheet.getLastRow();
  let max = 0;
  if (last >= 2) {
    sheet.getRange(2, 1, last - 1, 1).getValues().forEach(r => {
      const id = String(r[0]);
      if (id.startsWith(pfx)) {
        const n = parseInt(id.substring(pfx.length), 10);
        if (!isNaN(n) && n > max) max = n;
      }
    });
  }
  return pfx + ('000' + (max + 1)).slice(-3);
}

function generateTaskId() {
  const year = new Date().getFullYear();
  const pfx = 'TASK-' + year + '-';
  const sheet = getOrCreateSheet(SHEETS.TASKS || 'Tasks', HEADERS.Tasks);
  const last = sheet.getLastRow();
  let max = 0;
  if (last >= 2) {
    sheet.getRange(2, 1, last - 1, 1).getValues().forEach(r => {
      const id = String(r[0]);
      if (id.startsWith(pfx)) {
        const n = parseInt(id.substring(pfx.length), 10);
        if (!isNaN(n) && n > max) max = n;
      }
    });
  }
  return pfx + ('0000' + (max + 1)).slice(-4);
}

function generateMembershipId() {
  const year = new Date().getFullYear();
  const pfx = 'MEM-' + year + '-';
  const sheet = getOrCreateSheet(SHEETS.TEAM_MEMBERS || 'TeamMembers', HEADERS.TeamMembers);
  const last = sheet.getLastRow();
  let max = 0;
  if (last >= 2) {
    sheet.getRange(2, 1, last - 1, 1).getValues().forEach(r => {
      const id = String(r[0]);
      if (id.startsWith(pfx)) {
        const n = parseInt(id.substring(pfx.length), 10);
        if (!isNaN(n) && n > max) max = n;
      }
    });
  }
  return pfx + ('0000' + (max + 1)).slice(-4);
}

function generateTaskUpdateId() {
  const year = new Date().getFullYear();
  const pfx = 'UPD-' + year + '-';
  const sheet = getOrCreateSheet(SHEETS.TASK_UPDATES || 'TaskUpdates', HEADERS.TaskUpdates);
  const last = sheet.getLastRow();
  let max = 0;
  if (last >= 2) {
    sheet.getRange(2, 1, last - 1, 1).getValues().forEach(r => {
      const id = String(r[0]);
      if (id.startsWith(pfx)) {
        const n = parseInt(id.substring(pfx.length), 10);
        if (!isNaN(n) && n > max) max = n;
      }
    });
  }
  return pfx + ('0000' + (max + 1)).slice(-4);
}

function generateTaskAssignmentId() {
  const year = new Date().getFullYear();
  const pfx = 'TASG-' + year + '-';
  const sheet = getOrCreateSheet(SHEETS.TASK_ASSIGNMENTS || 'TaskAssignments', HEADERS.TaskAssignments);
  const last = sheet.getLastRow();
  let max = 0;
  if (last >= 2) {
    sheet.getRange(2, 1, last - 1, 1).getValues().forEach(r => {
      const id = String(r[0]);
      if (id.startsWith(pfx)) {
        const n = parseInt(id.substring(pfx.length), 10);
        if (!isNaN(n) && n > max) max = n;
      }
    });
  }
  return pfx + ('0000' + (max + 1)).slice(-4);
}

// ─── Extended Teams Functions ────────────────────────────────────

function addTeamMember(d) {
  d = d || {};
  if (!d.team_id || !d.staff_id) return jr('error', 'Team ID and Staff ID are required.');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getOrCreateSheet(SHEETS.TEAM_MEMBERS || 'TeamMembers', HEADERS.TeamMembers);
    const last = sheet.getLastRow();
    
    // Check if staff already member of this team
    if (last >= 2) {
      const rows = sheet.getRange(2, 1, last - 1, 13).getValues();
      for (let i = 0; i < rows.length; i++) {
        if (String(rows[i][1]) === String(d.team_id) && String(rows[i][3]) === String(d.staff_id)) {
          if (String(rows[i][7]).toUpperCase() === 'ACTIVE') {
            return jr('error', 'Staff member is already active in this team.');
          } else {
            // Re-activate
            sheet.getRange(i + 2, 8).setValue('ACTIVE');
            sheet.getRange(i + 2, 12).setValue('');
            sheet.getRange(i + 2, 13).setValue('');
            return jr('success', { message: 'Staff member re-activated in team.' });
          }
        }
      }
    }
    
    // Lookup staff name & email from Users sheet
    let sName = d.staff_name || '';
    let sEmail = d.staff_email || '';
    if (!sName || !sEmail) {
      const uSheet = getOrCreateSheet(SHEETS.USERS, HEADERS.Users);
      const uRow = findRowByValue(uSheet, U.ID, d.staff_id);
      if (uRow > 0) {
        sName = String(uSheet.getRange(uRow, U.NAME).getValue() || '');
        sEmail = String(uSheet.getRange(uRow, U.EMAIL).getValue() || '');
      }
    }
    
    // Lookup team name
    let tName = d.team_name || '';
    if (!tName) {
      const tSheet = getOrCreateSheet(SHEETS.TEAMS || 'Teams', HEADERS.Teams);
      const tRow = findRowByValue(tSheet, 1, d.team_id);
      if (tRow > 0) {
        tName = String(tSheet.getRange(tRow, 2).getValue() || '');
      }
    }
    
    const memId = generateMembershipId();
    const now = getNow();
    sheet.appendRow([
      memId, d.team_id, tName, d.staff_id, sName, sEmail,
      d.role || 'Member', 'ACTIVE', d.added_by || '', now.date, now.time, '', ''
    ]);
    
    logActivity({
      userId: d.added_by || '',
      userName: sName,
      role: 'Admin',
      action: 'STAFF_ADDED_TO_TEAM',
      relatedId: d.team_id,
      description: 'Added staff ' + sName + ' to team ' + tName,
      status: 'SUCCESS'
    });
    
    return jr('success', { id: memId, message: 'Staff added to team successfully.' });
  } finally {
    lock.releaseLock();
  }
}

function removeTeamMember(d) {
  d = d || {};
  if (!d.team_id || !d.staff_id) return jr('error', 'Team ID and Staff ID are required.');
  const sheet = getOrCreateSheet(SHEETS.TEAM_MEMBERS || 'TeamMembers', HEADERS.TeamMembers);
  const last = sheet.getLastRow();
  if (last < 2) return jr('error', 'No team memberships found.');
  
  const now = getNow();
  const rows = sheet.getRange(2, 1, last - 1, 13).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][1]) === String(d.team_id) && String(rows[i][3]) === String(d.staff_id) && String(rows[i][7]).toUpperCase() === 'ACTIVE') {
      sheet.getRange(i + 2, 8).setValue('REMOVED');
      sheet.getRange(i + 2, 12).setValue(now.date);
      sheet.getRange(i + 2, 13).setValue(now.time);
      
      logActivity({
        userId: d.removed_by || '',
        userName: String(rows[i][4] || ''),
        role: 'Admin',
        action: 'STAFF_REMOVED_FROM_TEAM',
        relatedId: d.team_id,
        description: 'Removed staff from team ' + String(rows[i][2] || ''),
        status: 'SUCCESS'
      });
      return jr('success', { message: 'Staff member removed from team.' });
    }
  }
  return jr('error', 'Active team membership not found.');
}

function getTeamMembers(p) {
  p = p || {};
  const sheet = getOrCreateSheet(SHEETS.TEAM_MEMBERS || 'TeamMembers', HEADERS.TeamMembers);
  const last = sheet.getLastRow();
  if (last < 2) return jr('success', []);
  
  let list = sheet.getRange(2, 1, last - 1, 13).getValues().map(r => ({
    membership_id: String(r[0]),
    team_id: String(r[1]),
    team_name: String(r[2]),
    staff_id: String(r[3]),
    staff_name: String(r[4]),
    staff_email: String(r[5]),
    role: String(r[6]),
    status: String(r[7]),
    added_by: String(r[8]),
    added_date: String(r[9]),
    added_time: String(r[10]),
    removed_date: String(r[11]),
    removed_time: String(r[12])
  })).filter(m => m.membership_id && m.status === 'ACTIVE');
  
  if (p.team_id) list = list.filter(m => m.team_id === String(p.team_id));
  if (p.staff_id) list = list.filter(m => m.staff_id === String(p.staff_id));
  return jr('success', list);
}

function getTeamById(p) {
  p = p || {};
  const teamId = p.team_id || p.id;
  if (!teamId) return jr('error', 'Team ID is required.');
  
  const teamsRes = getTeams();
  const teams = teamsRes.data || [];
  const team = teams.find(t => String(t.team_id) === String(teamId));
  if (!team) return jr('error', 'Team not found.');
  
  // Get members with their individual task counts
  const memRes = getTeamMembers({ team_id: teamId });
  const members = memRes.data || [];
  
  // Get tasks to compute individual member workload
  const tasksRes = getTasks();
  const allTasks = tasksRes.data || [];
  
  const enrichedMembers = members.map(m => {
    const mTasks = allTasks.filter(t => String(t.assigned_staff_id) === String(m.staff_id) && String(t.status).toUpperCase() !== 'COMPLETED' && String(t.status).toUpperCase() !== 'CANCELLED');
    const highPri = mTasks.filter(t => ['HIGH', 'URGENT'].includes(String(t.priority).toUpperCase())).length;
    const nowStr = getNow().date;
    const overdue = mTasks.filter(t => t.due_date && t.due_date < nowStr).length;
    
    let tier = 'AVAILABLE';
    let loadPct = 25;
    if (mTasks.length >= 8 || overdue >= 2) { tier = 'OVERLOADED'; loadPct = 95; }
    else if (mTasks.length >= 6) { tier = 'HIGH'; loadPct = 75; }
    else if (mTasks.length >= 3) { tier = 'NORMAL'; loadPct = 50; }
    
    return {
      ...m,
      active_tasks_count: mTasks.length,
      high_priority_count: highPri,
      overdue_count: overdue,
      workload_tier: tier,
      workload_percentage: loadPct
    };
  });
  
  // Get active projects for this team
  const projRes = getProjects();
  const teamProjects = (projRes.data || []).filter(pr => String(pr.team_id) === String(teamId) || String(pr.team_name) === String(team.team_name));
  
  return jr('success', {
    ...team,
    members: enrichedMembers,
    projects: teamProjects
  });
}

// ─── Extended Task & Assignment Functions ─────────────────────────

function reassignTask(d) {
  d = d || {};
  const taskId = d.task_id || d.id;
  const newStaffId = d.new_staff_id || d.staff_id;
  if (!taskId || !newStaffId) return jr('error', 'Task ID and new Staff ID required.');
  
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const tSheet = getOrCreateSheet(SHEETS.TASKS || 'Tasks', HEADERS.Tasks);
    const tRow = findRowByValue(tSheet, 1, taskId);
    if (tRow < 0) return jr('error', 'Task not found: ' + taskId);
    
    const now = getNow();
    const oldStaffId = String(tSheet.getRange(tRow, 6).getValue() || '');
    const oldStaffName = String(tSheet.getRange(tRow, 7).getValue() || '');
    const projId = String(tSheet.getRange(tRow, 2).getValue() || '');
    
    // Lookup new staff name
    let newStaffName = d.new_staff_name || '';
    if (!newStaffName) {
      const uSheet = getOrCreateSheet(SHEETS.USERS, HEADERS.Users);
      const uRow = findRowByValue(uSheet, U.ID, newStaffId);
      if (uRow > 0) newStaffName = String(uSheet.getRange(uRow, U.NAME).getValue() || '');
    }
    
    // Update task row
    tSheet.getRange(tRow, 6).setValue(newStaffId);
    tSheet.getRange(tRow, 7).setValue(newStaffName);
    tSheet.getRange(tRow, 14).setValue(now.date);
    tSheet.getRange(tRow, 15).setValue(now.time);
    
    // Mark previous active assignment in TaskAssignments as unassigned
    const asgSheet = getOrCreateSheet(SHEETS.TASK_ASSIGNMENTS || 'TaskAssignments', HEADERS.TaskAssignments);
    const asgLast = asgSheet.getLastRow();
    if (asgLast >= 2) {
      const asgRows = asgSheet.getRange(2, 1, asgLast - 1, 14).getValues();
      for (let i = 0; i < asgRows.length; i++) {
        if (String(asgRows[i][1]) === String(taskId) && String(asgRows[i][12]).toUpperCase() === 'ACTIVE') {
          asgSheet.getRange(i + 2, 11).setValue(now.date);
          asgSheet.getRange(i + 2, 12).setValue(now.time);
          asgSheet.getRange(i + 2, 13).setValue('REASSIGNED');
        }
      }
    }
    
    // Insert new assignment record
    const asgId = generateTaskAssignmentId();
    asgSheet.appendRow([
      asgId, taskId, projId, newStaffId, newStaffName,
      d.team_id || '', d.team_name || '',
      d.reassigned_by || '', now.date, now.time, '', '', 'ACTIVE',
      d.reassignment_reason || d.reason || 'Reassigned by Admin'
    ]);
    
    // Activity log
    logActivity({
      userId: d.reassigned_by || '',
      userName: newStaffName,
      role: 'Admin',
      action: 'TASK_REASSIGNED',
      relatedId: taskId,
      description: 'Reassigned from ' + oldStaffName + ' to ' + newStaffName + '. Reason: ' + (d.reassignment_reason || 'N/A'),
      status: 'SUCCESS'
    });
    
    return jr('success', {
      task_id: taskId,
      assigned_staff_id: newStaffId,
      assigned_staff_name: newStaffName,
      message: 'Task reassigned successfully.'
    });
  } finally {
    lock.releaseLock();
  }
}

function addTaskUpdate(d) {
  d = d || {};
  const taskId = d.task_id || d.id;
  if (!taskId || !d.update_text) return jr('error', 'Task ID and update text are required.');
  
  const lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch(e) {}
  try {
    const tSheet = getOrCreateSheet(SHEETS.TASKS || 'Tasks', HEADERS.Tasks);
    const tRow = findRowByValue(tSheet, T.ID, taskId);
    if (tRow < 0) return jr('error', 'Task not found: ' + taskId);
    
    const now = getNow();
    const projId = String(tSheet.getRange(tRow, T.PROJ_ID).getValue() || d.project_id || '');
    const updId = generateTaskUpdateId();
    const progressVal = d.progress !== undefined ? parseInt(d.progress, 10) : 0;
    const visibility = (d.visibility || 'INTERNAL').toUpperCase();
    
    // Append to TaskUpdates sheet
    const updSheet = getOrCreateSheet(SHEETS.TASK_UPDATES || 'TaskUpdates', HEADERS.TaskUpdates);
    updSheet.appendRow([
      updId, taskId, projId,
      d.staff_id || '', d.staff_name || '',
      d.update_text.trim(), progressVal, visibility,
      now.date, now.time
    ]);
    
    // Update task row status & timestamps
    if (d.status) {
      tSheet.getRange(tRow, T.STATUS).setValue(d.status);
    }
    tSheet.getRange(tRow, T.UPD_DATE).setValue(now.date);
    tSheet.getRange(tRow, T.UPD_TIME).setValue(now.time);
    
    // Update parent project progress & latest update
    if (projId) {
      recalculateProjectProgress(projId);
      try {
        const pSheet = getOrCreateSheet(SHEETS.PROJECTS, HEADERS.Projects);
        const pRow = findRowByValue(pSheet, P.ID, projId);
        if (pRow > 0) {
          pSheet.getRange(pRow, P.LATEST_UPDATE).setValue(d.update_text.trim());
          pSheet.getRange(pRow, P.UPD_DATE).setValue(now.date);
          pSheet.getRange(pRow, P.UPD_TIME).setValue(now.time);
        }
      } catch(e) {}
    }
    
    return jr('success', { update_id: updId, task_id: taskId, project_id: projId, progress: progressVal, message: 'Task update recorded successfully.' });
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function getTaskUpdates(p) {
  p = p || {};
  const sheet = getOrCreateSheet(SHEETS.TASK_UPDATES || 'TaskUpdates', HEADERS.TaskUpdates);
  const last = sheet.getLastRow();
  if (last < 2) return jr('success', []);
  
  let list = sheet.getRange(2, 1, last - 1, 10).getValues().map(r => ({
    update_id: String(r[0]),
    task_id: String(r[1]),
    project_id: String(r[2]),
    staff_id: String(r[3]),
    staff_name: String(r[4]),
    update_text: String(r[5]),
    progress: parseInt(r[6], 10) || 0,
    visibility: String(r[7]),
    created_date: String(r[8]),
    created_time: String(r[9]),
    created_at: String(r[8]) + ' ' + String(r[9])
  })).filter(u => u.update_id);
  
  if (p.task_id) list = list.filter(u => u.task_id === String(p.task_id));
  if (p.project_id) list = list.filter(u => u.project_id === String(p.project_id));
  if (p.client_view || p.role === 'User' || p.role === 'Client') {
    list = list.filter(u => u.visibility === 'CLIENT_VISIBLE');
  }
  return jr('success', list);
}

function getTaskAssignments(p) {
  p = p || {};
  const sheet = getOrCreateSheet(SHEETS.TASK_ASSIGNMENTS || 'TaskAssignments', HEADERS.TaskAssignments);
  const last = sheet.getLastRow();
  if (last < 2) return jr('success', []);
  
  let list = sheet.getRange(2, 1, last - 1, 14).getValues().map(r => ({
    assignment_id: String(r[0]),
    task_id: String(r[1]),
    project_id: String(r[2]),
    staff_id: String(r[3]),
    staff_name: String(r[4]),
    team_id: String(r[5]),
    team_name: String(r[6]),
    assigned_by: String(r[7]),
    assigned_date: String(r[8]),
    assigned_time: String(r[9]),
    unassigned_date: String(r[10]),
    unassigned_time: String(r[11]),
    status: String(r[12]),
    reassignment_reason: String(r[13])
  })).filter(a => a.assignment_id);
  
  if (p.task_id) list = list.filter(a => a.task_id === String(p.task_id));
  if (p.project_id) list = list.filter(a => a.project_id === String(p.project_id));
  return jr('success', list);
}

// ─── Automatic Progress Calculation ──────────────────────────────

function recalculateProjectProgress(projId) {
  if (!projId) return;
  try {
    const tSheet = getOrCreateSheet(SHEETS.TASKS || 'Tasks', HEADERS.Tasks);
    const last = tSheet.getLastRow();
    if (last < 2) return;
    
    const rows = tSheet.getRange(2, 1, last - 1, T.TOTAL).getValues();
    let total = 0;
    let completed = 0;
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][T.PROJ_ID - 1]).trim() === String(projId).trim()) {
        total++;
        if (String(rows[i][T.STATUS - 1]).trim().toUpperCase() === 'COMPLETED') {
          completed++;
        }
      }
    }
    
    if (total > 0) {
      const calcProgress = Math.round((completed / total) * 100);
      const pSheet = getOrCreateSheet(SHEETS.PROJECTS, HEADERS.Projects);
      const pRow = findRowByValue(pSheet, P.ID, projId);
      if (pRow > 0) {
        pSheet.getRange(pRow, P.PROGRESS).setValue(calcProgress);
      }
    }
  } catch (err) {
    Logger.log('Error recalculating project progress: ' + err);
  }
}

function getProjectProgress(p) {
  p = p || {};
  const projId = p.project_id || p.id;
  if (!projId) return jr('error', 'Project ID required.');
  
  const tasksRes = getTasks({ project_id: projId });
  const tasks = tasksRes.data || [];
  const total = tasks.length;
  const completed = tasks.filter(t => String(t.status).toUpperCase() === 'COMPLETED').length;
  const pending = tasks.filter(t => ['PENDING', 'TODO'].includes(String(t.status).toUpperCase())).length;
  const inProgress = tasks.filter(t => String(t.status).toUpperCase() === 'IN PROGRESS' || String(t.status).toUpperCase() === 'IN_PROGRESS').length;
  const nowStr = getNow().date;
  const overdue = tasks.filter(t => t.due_date && t.due_date < nowStr && String(t.status).toUpperCase() !== 'COMPLETED').length;
  
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return jr('success', {
    project_id: projId,
    progress: progressPct,
    total_tasks: total,
    completed_tasks: completed,
    pending_tasks: pending,
    in_progress_tasks: inProgress,
    overdue_tasks: overdue
  });
}

function getProjectById(p) {
  p = p || {};
  const projId = p.project_id || p.id;
  if (!projId) return jr('error', 'Project ID required.');
  
  const projRes = getProjects();
  const projects = projRes.data || [];
  const proj = projects.find(pr => String(pr.project_id) === String(projId));
  if (!proj) return jr('error', 'Project not found: ' + projId);
  
  const tasksRes = getTasks({ project_id: projId });
  const tasks = tasksRes.data || [];
  
  const updatesRes = getTaskUpdates({ project_id: projId });
  const updates = updatesRes.data || [];
  
  const actRes = getActivityLogs();
  const allActs = actRes.data || [];
  const activities = allActs.filter(a => String(a.related_id) === String(projId));
  
  return jr('success', {
    ...proj,
    tasks: tasks,
    updates: updates,
    activities: activities,
    team: {
      team_id: proj.team_id || '',
      team_name: proj.team_name || ''
    }
  });
}

function archiveProject(d) {
  d = d || {};
  const projId = d.project_id || d.id;
  if (!projId) return jr('error', 'Project ID required.');
  
  const pSheet = getOrCreateSheet(SHEETS.PROJECTS, HEADERS.Projects);
  const pRow = findRowByValue(pSheet, P.ID, projId);
  if (pRow < 0) return jr('error', 'Project not found: ' + projId);
  
  const now = getNow();
  pSheet.getRange(pRow, P.STATUS).setValue('ARCHIVED');
  pSheet.getRange(pRow, P.UPD_DATE).setValue(now.date);
  pSheet.getRange(pRow, P.UPD_TIME).setValue(now.time);
  
  logActivity({
    userId: d.archived_by || '',
    userName: '',
    role: 'Admin',
    action: 'PROJECT_ARCHIVED',
    relatedId: projId,
    description: 'Project archived: ' + projId,
    status: 'SUCCESS'
  });
  
  return jr('success', { message: 'Project archived successfully.' });
}

// ─── Work Distribution & Staff Workload ───────────────────────────

function getWorkDistribution(p) {
  p = p || {};
  const uSheet = getOrCreateSheet(SHEETS.USERS, HEADERS.Users);
  const uLast = uSheet.getLastRow();
  if (uLast < 2) return jr('success', []);
  
  // Get all Staff users
  const users = uSheet.getRange(2, 1, uLast - 1, U.TOTAL).getValues().filter(r => String(r[U.ROLE - 1]).toLowerCase() === 'staff').map(r => ({
    staff_id: String(r[U.ID - 1]),
    name: String(r[U.NAME - 1]),
    email: String(r[U.EMAIL - 1]),
    mobile: String(r[U.MOBILE - 1]),
    status: String(r[U.STATUS - 1])
  }));
  
  // Get all team memberships
  const memSheet = getOrCreateSheet(SHEETS.TEAM_MEMBERS || 'TeamMembers', HEADERS.TeamMembers);
  const memLast = memSheet.getLastRow();
  const teamMap = {};
  if (memLast >= 2) {
    memSheet.getRange(2, 1, memLast - 1, 8).getValues().forEach(r => {
      if (String(r[7]).toUpperCase() === 'ACTIVE') {
        const sid = String(r[3]);
        const tname = String(r[2]);
        if (!teamMap[sid]) teamMap[sid] = [];
        if (!teamMap[sid].includes(tname)) teamMap[sid].push(tname);
      }
    });
  }
  
  // Get all tasks
  const tSheet = getOrCreateSheet(SHEETS.TASKS || 'Tasks', HEADERS.Tasks);
  const tLast = tSheet.getLastRow();
  const tasks = tLast >= 2 ? tSheet.getRange(2, 1, tLast - 1, 12).getValues() : [];
  
  const nowStr = getNow().date;
  
  const distribution = users.map(u => {
    // Col index 7: Assigned Staff ID, Col index 10: Status, Col index 9: Priority, Col index 11: Due Date
    const sTasks = tasks.filter(r => String(r[7]) === u.staff_id && String(r[10]).toUpperCase() !== 'COMPLETED' && String(r[10]).toUpperCase() !== 'CANCELLED');
    const highPri = sTasks.filter(r => ['HIGH', 'URGENT'].includes(String(r[9]).toUpperCase())).length;
    const overdue = sTasks.filter(r => r[11] && String(r[11]) < nowStr).length;
    
    let tier = 'AVAILABLE';
    let loadPct = 25;
    if (sTasks.length >= 8 || overdue >= 2) {
      tier = 'OVERLOADED';
      loadPct = 95;
    } else if (sTasks.length >= 6) {
      tier = 'HIGH';
      loadPct = 75;
    } else if (sTasks.length >= 3) {
      tier = 'NORMAL';
      loadPct = 50;
    }
    
    return {
      staff_id: u.staff_id,
      name: u.name,
      email: u.email,
      mobile: u.mobile,
      team: (teamMap[u.staff_id] || ['General']).join(', '),
      active_tasks: sTasks.length,
      high_priority: highPri,
      overdue: overdue,
      workload_percentage: loadPct,
      workload_tier: tier,
      status: u.status
    };
  });
  
  return jr('success', distribution);
}

function getWorkManagementStats(p) {
  p = p || {};
  const projRes = getProjects();
  const projs = projRes.data || [];
  
  const tasksRes = getTasks();
  const tasks = tasksRes.data || [];
  
  const teamsRes = getTeams();
  const teams = teamsRes.data || [];
  
  const distRes = getWorkDistribution();
  const staff = distRes.data || [];
  
  const nowStr = getNow().date;
  
  const totalProjects = projs.length;
  const activeProjects = projs.filter(p => ['ACTIVE', 'IN PROGRESS', 'IN_PROGRESS'].includes(String(p.status).toUpperCase())).length;
  const completedProjects = projs.filter(p => String(p.status).toUpperCase() === 'COMPLETED').length;
  const pendingProjects = projs.filter(p => ['PLANNING', 'PENDING'].includes(String(p.status).toUpperCase())).length;
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => String(t.status).toUpperCase() === 'COMPLETED').length;
  const inProgressTasks = tasks.filter(t => ['IN PROGRESS', 'IN_PROGRESS'].includes(String(t.status).toUpperCase())).length;
  const pendingTasks = tasks.filter(t => ['TODO', 'PENDING'].includes(String(t.status).toUpperCase())).length;
  const overdueTasks = tasks.filter(t => t.due_date && t.due_date < nowStr && String(t.status).toUpperCase() !== 'COMPLETED').length;
  
  return jr('success', {
    total_projects: totalProjects,
    active_projects: activeProjects,
    completed_projects: completedProjects,
    pending_projects: pendingProjects,
    total_tasks: totalTasks,
    pending_tasks: pendingTasks,
    in_progress_tasks: inProgressTasks,
    completed_tasks: completedTasks,
    overdue_tasks: overdueTasks,
    total_teams: teams.length,
    active_staff: staff.length
  });
}

/**
 * ============================================================
 * MIGRATION UTILITY: migrateAllSheetsToStandardFormat
 * Standardizes all client sheets so that:
 * Column 1: Record ID
 * Column 2: Client Name
 * Column 3: Client Email
 * ============================================================
 */
function migrateAllSheetsToStandardFormat() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  Logger.log('Starting migration to standard schema (Client Name in col 2, Client Email in col 3)...');

  // Build lookup maps for Users (User ID -> {name, email}) and Projects (Project ID -> {clientName, clientEmail, customerId})
  const userMap = {};
  const uSheet = ss.getSheetByName(SHEETS.USERS);
  if (uSheet && uSheet.getLastRow() >= 2) {
    const uRows = uSheet.getRange(2, 1, uSheet.getLastRow() - 1, 3).getValues();
    uRows.forEach(r => {
      const uid = String(r[0]).trim();
      if (uid) userMap[uid] = { name: String(r[1] || ''), email: String(r[2] || '') };
    });
  }

  const projMap = {};
  const pSheet = ss.getSheetByName(SHEETS.PROJECTS);
  if (pSheet && pSheet.getLastRow() >= 2) {
    const pRows = pSheet.getRange(2, 1, pSheet.getLastRow() - 1, Math.max(6, pSheet.getLastColumn())).getValues();
    const pHeaders = pSheet.getRange(1, 1, 1, pSheet.getLastColumn()).getValues()[0];
    const isNewSchema = String(pHeaders[1] || '').toLowerCase().includes('client');
    pRows.forEach(r => {
      const pid = String(r[0]).trim();
      if (pid) {
        if (isNewSchema) {
          projMap[pid] = { clientName: String(r[1] || ''), clientEmail: String(r[2] || ''), customerId: String(r[3] || '') };
        } else {
          const custId = String(r[1] || '');
          const u = userMap[custId] || {};
          projMap[pid] = { clientName: u.name || '', clientEmail: u.email || '', customerId: custId };
        }
      }
    });
  }

  // Helper to safely format header row
  function applyHeaderStyle(sheet, cols) {
    sheet.getRange(1, 1, 1, cols.length).setValues([cols])
      .setBackground('#0f172a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // 1. Projects Sheet
  try {
    let ps = ss.getSheetByName(SHEETS.PROJECTS);
    if (!ps) {
      ps = ss.insertSheet(SHEETS.PROJECTS);
      applyHeaderStyle(ps, HEADERS.Projects);
    } else {
      const currentH = ps.getRange(1, 1, 1, Math.max(1, ps.getLastColumn())).getValues()[0];
      if (String(currentH[1] || '').trim() !== 'Client Name') {
        Logger.log('Migrating Projects sheet columns...');
        ps.insertColumnsAfter(1, 2);
        const last = ps.getLastRow();
        if (last >= 2) {
          const rows = ps.getRange(2, 1, last - 1, ps.getLastColumn()).getValues();
          for (let i = 0; i < rows.length; i++) {
            const custId = String(rows[i][3] || '').trim();
            const u = userMap[custId] || {};
            if (u.name) ps.getRange(i + 2, 2).setValue(u.name);
            if (u.email) ps.getRange(i + 2, 3).setValue(u.email);
          }
        }
      }
      applyHeaderStyle(ps, HEADERS.Projects);
    }
  } catch(e) { Logger.log('Projects migration error: ' + e.toString()); }

  // 2. Tasks Sheet
  try {
    let ts = ss.getSheetByName(SHEETS.TASKS);
    if (!ts) {
      ts = ss.insertSheet(SHEETS.TASKS);
      applyHeaderStyle(ts, HEADERS.Tasks);
    } else {
      const currentH = ts.getRange(1, 1, 1, Math.max(1, ts.getLastColumn())).getValues()[0];
      if (String(currentH[1] || '').trim() !== 'Client Name') {
        Logger.log('Migrating Tasks sheet columns...');
        ts.insertColumnsAfter(1, 2);
        const last = ts.getLastRow();
        if (last >= 2) {
          const rows = ts.getRange(2, 1, last - 1, ts.getLastColumn()).getValues();
          for (let i = 0; i < rows.length; i++) {
            const pid = String(rows[i][3] || '').trim();
            const p = projMap[pid] || {};
            if (p.clientName) ts.getRange(i + 2, 2).setValue(p.clientName);
            if (p.clientEmail) ts.getRange(i + 2, 3).setValue(p.clientEmail);
          }
        }
      }
      applyHeaderStyle(ts, HEADERS.Tasks);
    }
  } catch(e) { Logger.log('Tasks migration error: ' + e.toString()); }

  // 3. Meetings Sheet
  try {
    let ms = ss.getSheetByName(SHEETS.MEETINGS);
    if (!ms) {
      ms = ss.insertSheet(SHEETS.MEETINGS);
      applyHeaderStyle(ms, HEADERS.Meetings);
    } else {
      const currentH = ms.getRange(1, 1, 1, Math.max(1, ms.getLastColumn())).getValues()[0];
      if (String(currentH[1] || '').trim() !== 'Client Name') {
        Logger.log('Migrating Meetings sheet columns...');
        ms.insertColumnsAfter(1, 2);
        const last = ms.getLastRow();
        if (last >= 2) {
          const rows = ms.getRange(2, 1, last - 1, ms.getLastColumn()).getValues();
          for (let i = 0; i < rows.length; i++) {
            const pid = String(rows[i][3] || '').trim();
            const cid = String(rows[i][4] || '').trim();
            const p = projMap[pid] || {};
            const u = userMap[cid] || {};
            const cName = p.clientName || u.name || '';
            const cEmail = p.clientEmail || u.email || '';
            if (cName) ms.getRange(i + 2, 2).setValue(cName);
            if (cEmail) ms.getRange(i + 2, 3).setValue(cEmail);
          }
        }
      }
      applyHeaderStyle(ms, HEADERS.Meetings);
    }
  } catch(e) { Logger.log('Meetings migration error: ' + e.toString()); }

  // 4. Tickets Sheet
  try {
    let tks = ss.getSheetByName(SHEETS.TICKETS);
    if (!tks) {
      tks = ss.insertSheet(SHEETS.TICKETS);
      applyHeaderStyle(tks, HEADERS.Tickets);
    } else {
      const currentH = tks.getRange(1, 1, 1, Math.max(1, tks.getLastColumn())).getValues()[0];
      if (String(currentH[1] || '').trim() !== 'Client Name') {
        Logger.log('Migrating Tickets sheet columns...');
        tks.insertColumnsAfter(1, 2);
        const last = tks.getLastRow();
        if (last >= 2) {
          const rows = tks.getRange(2, 1, last - 1, tks.getLastColumn()).getValues();
          for (let i = 0; i < rows.length; i++) {
            const cid = String(rows[i][3] || '').trim();
            const u = userMap[cid] || {};
            if (u.name) tks.getRange(i + 2, 2).setValue(u.name);
            if (u.email) tks.getRange(i + 2, 3).setValue(u.email);
          }
        }
      }
      applyHeaderStyle(tks, HEADERS.Tickets);
    }
  } catch(e) { Logger.log('Tickets migration error: ' + e.toString()); }

  // 5. Invoices Sheet
  try {
    let invs = ss.getSheetByName(SHEETS.INVOICES);
    if (!invs) {
      invs = ss.insertSheet(SHEETS.INVOICES);
      applyHeaderStyle(invs, HEADERS.Invoices);
    } else {
      const currentH = invs.getRange(1, 1, 1, Math.max(1, invs.getLastColumn())).getValues()[0];
      if (String(currentH[1] || '').trim() !== 'Client Name') {
        Logger.log('Migrating Invoices sheet columns...');
        invs.insertColumnsAfter(1, 2);
        const last = invs.getLastRow();
        if (last >= 2) {
          const rows = invs.getRange(2, 1, last - 1, invs.getLastColumn()).getValues();
          for (let i = 0; i < rows.length; i++) {
            const cid = String(rows[i][5] || '').trim();
            const u = userMap[cid] || {};
            const cName = String(rows[i][6] || u.name || '');
            const cEmail = String(rows[i][7] || u.email || '');
            if (cName) invs.getRange(i + 2, 2).setValue(cName);
            if (cEmail) invs.getRange(i + 2, 3).setValue(cEmail);
          }
        }
      }
      applyHeaderStyle(invs, HEADERS.Invoices);
    }
  } catch(e) { Logger.log('Invoices migration error: ' + e.toString()); }

  // 6. Payments Sheet
  try {
    let pays = ss.getSheetByName(SHEETS.PAYMENTS);
    if (!pays) {
      pays = ss.insertSheet(SHEETS.PAYMENTS);
      applyHeaderStyle(pays, HEADERS.Payments);
    } else {
      const currentH = pays.getRange(1, 1, 1, Math.max(1, pays.getLastColumn())).getValues()[0];
      if (String(currentH[1] || '').trim() !== 'Client Name') {
        Logger.log('Migrating Payments sheet columns...');
        pays.insertColumnsAfter(1, 2);
        const last = pays.getLastRow();
        if (last >= 2) {
          const rows = pays.getRange(2, 1, last - 1, pays.getLastColumn()).getValues();
          for (let i = 0; i < rows.length; i++) {
            const cid = String(rows[i][6] || '').trim();
            const u = userMap[cid] || {};
            if (u.name) pays.getRange(i + 2, 2).setValue(u.name);
            if (u.email) pays.getRange(i + 2, 3).setValue(u.email);
          }
        }
      }
      applyHeaderStyle(pays, HEADERS.Payments);
    }
  } catch(e) { Logger.log('Payments migration error: ' + e.toString()); }

  // 7. Documents Sheet
  try {
    let docs = ss.getSheetByName(SHEETS.DOCUMENTS);
    if (!docs) {
      docs = ss.insertSheet(SHEETS.DOCUMENTS);
      applyHeaderStyle(docs, HEADERS.Documents);
    } else {
      const currentH = docs.getRange(1, 1, 1, Math.max(1, docs.getLastColumn())).getValues()[0];
      if (String(currentH[1] || '').trim() !== 'Client Name') {
        Logger.log('Migrating Documents sheet columns...');
        docs.insertColumnsAfter(1, 2);
        const last = docs.getLastRow();
        if (last >= 2) {
          const rows = docs.getRange(2, 1, last - 1, docs.getLastColumn()).getValues();
          for (let i = 0; i < rows.length; i++) {
            const cid = String(rows[i][5] || '').trim();
            const u = userMap[cid] || {};
            if (u.name) docs.getRange(i + 2, 2).setValue(u.name);
            if (u.email) docs.getRange(i + 2, 3).setValue(u.email);
          }
        }
      }
      applyHeaderStyle(docs, HEADERS.Documents);
    }
  } catch(e) { Logger.log('Documents migration error: ' + e.toString()); }

  // 8. Files Sheet
  try {
    let files = ss.getSheetByName(SHEETS.FILES);
    if (!files) {
      files = ss.insertSheet(SHEETS.FILES);
      applyHeaderStyle(files, HEADERS.Files);
    } else {
      const currentH = files.getRange(1, 1, 1, Math.max(1, files.getLastColumn())).getValues()[0];
      if (String(currentH[1] || '').trim() !== 'Client Name') {
        files.insertColumnsAfter(1, 2);
      }
      applyHeaderStyle(files, HEADERS.Files);
    }
  } catch(e) { Logger.log('Files migration error: ' + e.toString()); }

  // 9. BrandInfo Sheet
  try {
    let brands = ss.getSheetByName(SHEETS.BRAND_INFO || 'BrandInfo');
    if (!brands) {
      brands = ss.insertSheet(SHEETS.BRAND_INFO || 'BrandInfo');
      applyHeaderStyle(brands, HEADERS.BrandInfo);
    } else {
      const currentH = brands.getRange(1, 1, 1, Math.max(1, brands.getLastColumn())).getValues()[0];
      if (String(currentH[1] || '').trim() !== 'Client Name') {
        Logger.log('Migrating BrandInfo sheet columns...');
        brands.insertColumnsAfter(1, 2);
        const last = brands.getLastRow();
        if (last >= 2) {
          const rows = brands.getRange(2, 1, last - 1, brands.getLastColumn()).getValues();
          for (let i = 0; i < rows.length; i++) {
            const uid = String(rows[i][3] || '').trim();
            const u = userMap[uid] || {};
            if (u.name) brands.getRange(i + 2, 2).setValue(u.name);
            if (u.email) brands.getRange(i + 2, 3).setValue(u.email);
          }
        }
      }
      applyHeaderStyle(brands, HEADERS.BrandInfo);
    }
  } catch(e) { Logger.log('BrandInfo migration error: ' + e.toString()); }

  // 10. Enquiries Sheet
  try {
    repairEnquiriesHeaders();
  } catch(e) { Logger.log('Enquiries migration error: ' + e.toString()); }

  // Run repairAllHeaders to ensure all sheets are aligned
  repairAllHeaders();

  Logger.log('Migration to standard schema complete.');
  return 'SUCCESS: All sheets successfully verified and migrated to standard format (Client Name col 2, Client Email col 3).';
}
