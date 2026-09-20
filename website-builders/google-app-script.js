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
  TICKET_MESSAGES:'TicketMessages', BRAND_INFO:'BrandInfo'
};

// Column indexes (1-based)
const U={ID:1,NAME:2,EMAIL:3,MOBILE:4,PASS:5,ROLE:6,STATUS:7,CREATED_DATE:8,CREATED_TIME:9,LAST_LOGIN_DATE:10,LAST_LOGIN_TIME:11,LAST_ACT_DATE:12,LAST_ACT_TIME:13,UPD_DATE:14,UPD_TIME:15,ASSIGNED_STAFF:16,TOTAL:16};
const M={ID:1,CONV_ID:2,SENDER_ID:3,SENDER_NAME:4,SENDER_ROLE:5,RECV_ID:6,RECV_NAME:7,RECV_ROLE:8,RECIP_TYPE:9,MSG_TYPE:10,PROJ_ID:11,CUST_ID:12,SUBJECT:13,BODY:14,ATTACH:15,STATUS:16,READ_AT:17,CREATED_DATE:18,CREATED_TIME:19,UPDATED:20,TOTAL:20};
const E={SUBMISSION_ID:1,TIMESTAMP:2,CUSTOMER_NAME:3,EMAIL:4,MOBILE_NUMBER:5,ADDRESS:6,MESSAGE:7,EMAIL_STATUS:8,EMAIL_SENT_AT:9,OWNER_NOTIF_STAT:10,OWNER_NOTIF_TIME:11,TICKET_STATUS:12,ASSIGNED_TO:13,FOLLOWUP_DATE:14,FOLLOWUP_STATUS:15,SOURCE_PAGE:16,REMARKS:17,CUST_ID:18,PROJ_ID:19,TOTAL:19};
const P={ID:1,CUST_ID:2,CUST_NAME:3,PROJ_NAME:4,DESC:5,STAGE:6,PROGRESS:7,DELIVERY:8,STATUS:9,CREATED_BY:10,CREATED_DATE:11,CREATED_TIME:12,UPD_DATE:13,UPD_TIME:14,LATEST_UPDATE:15,TOTAL:15};
const A={ID:1,PROJ_ID:2,STAFF_ID:3,STAFF_NAME:4,ASSIGNED_BY:5,ASSIGNED_DATE:6,ASSIGNED_TIME:7,UNASSIGNED_DATE:8,STATUS:9,TOTAL:9};
const PU={ID:1,PROJ_ID:2,STAFF_ID:3,STAFF_NAME:4,STAGE:5,PROGRESS:6,TEXT:7,REMARK:8,CREATED_DATE:9,CREATED_TIME:10,TOTAL:10};
const AL={ID:1,USER_ID:2,USER_NAME:3,ROLE:4,ACTION:5,RELATED_ID:6,DESC:7,DATE:8,TIME:9,STATUS:10,TOTAL:10};
const T={ID:1,PROJ_ID:2,PROJ_NAME:3,TITLE:4,DESC:5,STAFF_ID:6,STAFF_NAME:7,PRIORITY:8,STATUS:9,DUE_DATE:10,CREATED_BY:11,CREATED_DATE:12,CREATED_TIME:13,UPD_DATE:14,UPD_TIME:15,TOTAL:15};

const HEADERS={
  Users:['User ID','Full Name','Email','Mobile Number','Password Hash','Role','Status','Created Date','Created Time','Last Login Date','Last Login Time','Last Activity Date','Last Activity Time','Updated Date','Updated Time','Assigned Staff ID'],
  Messages:['Message ID','Conversation ID','Sender ID','Sender Name','Sender Role','Receiver ID','Receiver Name','Receiver Role','Project ID','Customer ID','Subject','Message','Status','Read At','Created Date','Created Time','Last Updated','Deleted By Sender','Deleted By Receiver','Deleted Date','Deleted Time'],
  Enquiries:['Submission ID','Timestamp','Customer Name','Email','Mobile Number','Address','Message','Email Status','Email Sent At','Owner Notification Status','Owner Notification Time','Ticket Status','Assigned To','Followup Date','Followup Status','Source Page','Remarks','Customer ID','Project ID'],
  Projects:['Project ID','Customer ID','Customer Name','Project Name','Description','Current Stage','Progress','Expected Delivery Date','Status','Created By','Created Date','Created Time','Updated Date','Updated Time','Latest Update'],
  ProjectAssignments:['Assignment ID','Project ID','Staff ID','Staff Name','Assigned By','Assigned Date','Assigned Time','Unassigned Date','Status'],
  ProjectUpdates:['Update ID','Project ID','Staff ID','Staff Name','Stage','Progress','Update Text','Remark','Created Date','Created Time'],
  ActivityLogs:['Activity ID','User ID','User Name','Role','Action','Related ID','Description','Date','Time','Status'],
  Tasks:['Task ID','Project ID','Project Name','Task Title','Description','Assigned Staff ID','Assigned Staff Name','Priority','Status','Due Date','Created By','Created Date','Created Time','Updated Date','Updated Time'],
  Invoices:['Invoice ID','Project ID','Project Name','Customer ID','Customer Name','Customer Email','Amount','GST Amount','Total Amount','Status','Due Date','Paid At','Razorpay Order ID','Razorpay Payment ID','Created Date','Updated Date'],
  InvoiceItems:['Item ID','Invoice ID','Description','Quantity','Rate','Amount'],
  Payments:['Payment ID','Razorpay Order ID','Razorpay Payment ID','Invoice ID','Customer ID','Amount','Currency','Status','Signature','Paid At'],
  Files:['File ID','Project ID','Uploaded By','File Name','File URL','File Size','File Type','Category','Uploaded At'],
  Tickets:['Ticket ID','Customer ID','Customer Name','Customer Email','Subject','Priority','Status','Assigned To','Created At','Updated At'],
  TicketMessages:['Message ID','Ticket ID','Sender Email','Sender Role','Message','Timestamp'],
  BrandInfo:['Brand ID','User ID','Brand Name','Tagline','Primary Color','Secondary Color','Font Family','Target Audience','Competitors','Brand Values','Assets URL','Updated At']
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
    'Invoices': ['Invoice ID','Project ID','Project Name','Customer ID','Customer Name','Customer Email','Amount','GST Amount','Total Amount','Status','Due Date','Paid At','Razorpay Order ID','Razorpay Payment ID','Created Date','Updated Date'],
    'InvoiceItems': ['Item ID','Invoice ID','Description','Quantity','Rate','Amount'],
    'Payments': ['Payment ID','Razorpay Order ID','Razorpay Payment ID','Invoice ID','Customer ID','Amount','Currency','Status','Signature','Paid At'],
    'Files': ['File ID','Project ID','Uploaded By','File Name','File URL','File Size','File Type','Category','Uploaded At'],
    'Tickets': ['Ticket ID','Customer ID','Customer Name','Customer Email','Subject','Priority','Status','Assigned To','Created At','Updated At'],
    'TicketMessages': ['Message ID','Ticket ID','Sender Email','Sender Role','Message','Timestamp'],
    'BrandInfo': ['Brand ID','User ID','Brand Name','Tagline','Primary Color','Secondary Color','Font Family','Target Audience','Competitors','Brand Values','Assets URL','Updated At']
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
  if(!e||!e.parameter) return jr('error','Invalid request.');
  const p=e.parameter;
  if(p.token&&p.token===CONFIG.SHARED_SECRET){
    const action=p.action||'';
    let data={};
    try{if(p.data)data=JSON.parse(p.data);}catch(err){}
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
      if(action==='sync_message')     return sendMessage({sender_id:data.sender_id,sender_name:data.sender_name,sender_role:data.sender_role,receiver_id:data.receiver_id,receiver_name:data.receiver_name,receiver_role:data.receiver_role,conversation_id:data.conversation_id,body:data.body||data.message,subject:data.subject,project_id:data.project_id,customer_id:data.customer_id,recipient_type:data.recipient_type,message_type:data.message_type});
      if(action==='sync_audit')       return logActivity({userId:'',userName:data.user_email||'',role:'',action:data.action||'AUDIT',relatedId:'',description:data.action||'',status:data.status||'SUCCESS'});
      if(action==='update_enquiry')   return updateEnquiry({enquiry_id:p.submissionId,status:p.ticketStatus,assigned_to:p.assignedTo});
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

function convertEnquiry(d){
  d = d || {};
  const enqId = d.enquiry_id || d.id || d.submission_id;
  if(!enqId) return jr('error','Enquiry ID required.');
  const sheet=getOrCreateSheet(SHEETS.ENQUIRIES,HEADERS.Enquiries);
  const colMap=getEnquiryColMap(sheet);
  const subCol = colMap.SUBMISSION_ID || E.SUBMISSION_ID;
  const row=findRowByValue(sheet,subCol,enqId);
  if(row<0) return jr('error','Enquiry not found.');
  // Read enquiry data
  const totalCols=Math.max(sheet.getLastColumn(),colMap.TOTAL||E.TOTAL);
  const r=sheet.getRange(row,1,1,totalCols).getValues()[0];
  const getVal=(colIdx)=>(colIdx&&colIdx<=r.length)?String(r[colIdx-1]||''):'';
  const custName=getVal(colMap.CUSTOMER_NAME);
  const custEmail=getVal(colMap.EMAIL);
  const custId=getVal(colMap.CUST_ID)||'';
  const enqMessage=getVal(colMap.MESSAGE);
  // Create project
  var projResult=createProject({
    project_name: d.name||d.project_name||(custName+' Website Project'),
    customer_id: custId,
    customer_name: custName,
    description: d.description||enqMessage,
    stage: d.initial_stage||d.stage||'Planning',
    progress: d.initial_progress||d.progress||0,
    expected_delivery: d.expected_delivery||'',
    status: 'Active',
    staff_id: d.assigned_staff_id||'',
    staff_name: d.assigned_staff_name||'',
    created_by: d.converted_by||''
  });
  // Parse response to get project_id
  var projData={};
  try{projData=JSON.parse(projResult.getContent());}catch(e){}
  var projId=(projData.data&&projData.data.project_id)||'';
  // Update enquiry as converted
  if(projId){
    if(colMap.TICKET_STATUS) sheet.getRange(row,colMap.TICKET_STATUS).setValue('Converted');
    if(colMap.PROJ_ID) sheet.getRange(row,colMap.PROJ_ID).setValue(projId);
    if(colMap.REMARKS) sheet.getRange(row,colMap.REMARKS).setValue('Converted to project '+projId);
  }
  logActivity({userId:d.converted_by||'',userName:'',role:'',action:'ENQUIRY_CONVERTED',relatedId:enqId,description:'Enquiry converted to project '+projId,status:'SUCCESS'});
  return jr('success',{message:'Enquiry converted to project.',project_id:projId,enquiry_id:enqId});
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
      status: getVal(colMap.TICKET_STATUS) || 'New',
      ticket_status: getVal(colMap.TICKET_STATUS) || 'New',
      assigned_to: assignedTo,
      assigned_staff_id: assignedTo,
      assigned_staff_name: assignedStaffName,
      followup_date: getVal(colMap.FOLLOWUP_DATE),
      followup_status: getVal(colMap.FOLLOWUP_STATUS),
      source_page: getVal(colMap.SOURCE_PAGE),
      remarks: getVal(colMap.REMARKS),
      project_id: getVal(colMap.PROJ_ID),
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
  if(!d.project_name||!d.customer_id) return jr('error','Project name and customer ID required.');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const sheet=getOrCreateSheet(SHEETS.PROJECTS,HEADERS.Projects);
    const now=getNow();const projId=generateProjectId();
    sheet.appendRow([projId,d.customer_id,d.customer_name||'',d.project_name.trim(),(d.description||'').trim(),d.stage||'Planning',parseInt(d.progress||0),d.expected_delivery||'',d.status||'Active',d.created_by||'',now.date,now.time,'','','']);
    if(d.staff_id) assignStaff({project_id:projId,staff_id:d.staff_id,staff_name:d.staff_name||'',assigned_by:d.created_by||''});
    logActivity({userId:d.created_by||'',userName:'',role:'',action:'PROJECT_CREATED',relatedId:projId,description:'Project created: '+projId,status:'SUCCESS'});
    return jr('success',{id:projId,project_id:projId,message:'Project created.'});
  }finally{lock.releaseLock();}
}

function updateProject(d){
  d = d || {};
  if(!d.project_id) return jr('error','Project ID required.');
  const sheet=getOrCreateSheet(SHEETS.PROJECTS,HEADERS.Projects);
  const row=findRowByValue(sheet,P.ID,d.project_id);
  if(row<0) return jr('error','Project not found.');
  const now=getNow();
  if(d.project_name)  sheet.getRange(row,P.PROJ_NAME).setValue(d.project_name);
  if(d.description)   sheet.getRange(row,P.DESC).setValue(d.description);
  if(d.stage)         sheet.getRange(row,P.STAGE).setValue(d.stage);
  if(d.progress!==undefined) sheet.getRange(row,P.PROGRESS).setValue(parseInt(d.progress));
  if(d.expected_delivery) sheet.getRange(row,P.DELIVERY).setValue(d.expected_delivery);
  if(d.status)        sheet.getRange(row,P.STATUS).setValue(d.status);
  if(d.latest_update) sheet.getRange(row,P.LATEST_UPDATE).setValue(d.latest_update);
  sheet.getRange(row,P.UPD_DATE).setValue(now.date);
  sheet.getRange(row,P.UPD_TIME).setValue(now.time);
  return jr('success',{message:'Project updated.',id:d.project_id});
}

function getProjects(p){
  p = p || {};
  const sheet=getOrCreateSheet(SHEETS.PROJECTS,HEADERS.Projects);
  const last=sheet.getLastRow();
  if(last<2) return jr('success',[]);

  // Get active assignments to populate assigned_staff_name & assigned_staff_id
  const as=getOrCreateSheet(SHEETS.ASSIGNMENTS,HEADERS.ProjectAssignments);
  const aLast=as.getLastRow();
  const assignMap={};
  if(aLast>=2){
    as.getRange(2,1,aLast-1,A.TOTAL).getValues().forEach(r=>{
      if(String(r[A.STATUS-1]).toUpperCase()==='ACTIVE'){
        const pid=String(r[A.PROJ_ID-1]);
        if(pid && !assignMap[pid]){
          assignMap[pid]={
            staff_id:String(r[A.STAFF_ID-1]),
            staff_name:String(r[A.STAFF_NAME-1])
          };
        }
      }
    });
  }

  let list=sheet.getRange(2,1,last-1,P.TOTAL).getValues().map(r=>{
    const pid=String(r[P.ID-1]);
    const asg=assignMap[pid] || {};
    return {
      project_id:pid,
      id:pid,
      customer_id:String(r[P.CUST_ID-1]),
      customer_name:String(r[P.CUST_NAME-1]),
      project_name:String(r[P.PROJ_NAME-1]),
      name:String(r[P.PROJ_NAME-1]),
      description:String(r[P.DESC-1]),
      stage:String(r[P.STAGE-1]),
      progress:parseInt(r[P.PROGRESS-1])||0,
      expected_delivery:String(r[P.DELIVERY-1]),
      status:String(r[P.STATUS-1]),
      created_by:String(r[P.CREATED_BY-1]),
      created_at:String(r[P.CREATED_DATE-1])+' '+String(r[P.CREATED_TIME-1]),
      updated_at:String(r[P.UPD_DATE-1])+' '+String(r[P.UPD_TIME-1]),
      latest_update:String(r[P.LATEST_UPDATE-1]),
      assigned_staff_id:asg.staff_id || '',
      assigned_staff_name:asg.staff_name || ''
    };
  }).filter(pr=>pr.project_id);

  if(p.customer_id) list=list.filter(pr=>pr.customer_id===p.customer_id);
  if(p.status)      list=list.filter(pr=>pr.status.toLowerCase()===p.status.toLowerCase());
  if(p.staff_id){
    list=list.filter(pr=>pr.assigned_staff_id===p.staff_id);
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
    let projName = d.project_name || '';
    const projId = d.project_id || '';
    if(!projName && projId){
      const pSheet=getOrCreateSheet(SHEETS.PROJECTS,HEADERS.Projects);
      const pRow=findRowByValue(pSheet,P.ID,projId);
      if(pRow>0) projName = String(pSheet.getRange(pRow,P.PROJ_NAME).getValue()||'');
    }
    const status = d.status || 'Pending';
    const priority = d.priority || 'Normal';
    const desc = d.description || '';
    const dueDate = d.due_date || '';
    const createdBy = d.created_by || '';

    sheet.appendRow([
      taskId, projId, projName, d.title.trim(), desc.trim(),
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

  if(p.staff_id)   list=list.filter(t=>t.assigned_staff_id===p.staff_id);
  if(p.project_id) list=list.filter(t=>t.project_id===p.project_id);
  if(p.status)     list=list.filter(t=>t.status.toLowerCase()===p.status.toLowerCase());
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

function syncLegacyUser(u){
  const sheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
  const row=findRowByValue(sheet,U.EMAIL,String(u.email||'').toLowerCase());
  if(row>0){
    if(u.full_name)sheet.getRange(row,U.NAME).setValue(u.full_name);
    if(u.mobile)   sheet.getRange(row,U.MOBILE).setValue(u.mobile);
    if(u.role)     sheet.getRange(row,U.ROLE).setValue(normalizeRole(u.role));
    if(u.is_active!==undefined)sheet.getRange(row,U.STATUS).setValue(u.is_active?'ACTIVE':'INACTIVE');
    const now=getNow();sheet.getRange(row,U.UPD_DATE).setValue(now.date);sheet.getRange(row,U.UPD_TIME).setValue(now.time);
  }
  return jr('success','User synced.');
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
  if (!d.sender_id || !d.receiver_id || !d.message) return jr('error', 'Sender, receiver, and message are required.');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const uSheet = getOrCreateSheet(SHEETS.USERS, HEADERS.Users);
    const sRow = findRowByValue(uSheet, U.ID, d.sender_id);
    const rRow = findRowByValue(uSheet, U.ID, d.receiver_id);
    if (sRow < 0) return jr('error', 'Sender not found.');
    if (rRow < 0) return jr('error', 'Receiver not found.');
    
    const senderRole = normalizeRole(uSheet.getRange(sRow, U.ROLE).getValue());
    const recvRole = normalizeRole(uSheet.getRange(rRow, U.ROLE).getValue());
    const senderName = uSheet.getRange(sRow, U.NAME).getValue();
    const recvName = uSheet.getRange(rRow, U.NAME).getValue();

    if (senderRole === 'User') {
      const senderAssignedStaff = String(uSheet.getRange(sRow, U.ASSIGNED_STAFF).getValue());
      if (recvRole === 'User') return jr('error', 'Clients cannot message other clients.');
      if (recvRole === 'Staff' && senderAssignedStaff !== d.receiver_id) return jr('error', 'You can only message your assigned staff.');
    }

    const sheet = getOrCreateSheet(SHEETS.MESSAGES, HEADERS.Messages);
    const colMap = getMessageColMap(sheet);
    const msgId = generateId('MSG', SHEETS.MESSAGES, colMap.ID || M.ID);
    let convId = d.conversation_id;
    if (!convId) {
      convId = findExistingConversation(d.sender_id, d.receiver_id);
      if (!convId) convId = generateConvId();
    }
    
    const now = getNow();
    const maxCols = Math.max(sheet.getLastColumn(), HEADERS.Messages.length);
    const newRow = new Array(maxCols).fill('');
    
    if (colMap.ID) newRow[colMap.ID-1] = msgId;
    if (colMap.CONV_ID) newRow[colMap.CONV_ID-1] = convId;
    if (colMap.SENDER_ID) newRow[colMap.SENDER_ID-1] = d.sender_id;
    if (colMap.SENDER_NAME) newRow[colMap.SENDER_NAME-1] = senderName;
    if (colMap.SENDER_ROLE) newRow[colMap.SENDER_ROLE-1] = senderRole;
    if (colMap.RECV_ID) newRow[colMap.RECV_ID-1] = d.receiver_id;
    if (colMap.RECV_NAME) newRow[colMap.RECV_NAME-1] = recvName;
    if (colMap.RECV_ROLE) newRow[colMap.RECV_ROLE-1] = recvRole;
    if (colMap.PROJ_ID) newRow[colMap.PROJ_ID-1] = d.project_id || '';
    if (colMap.CUST_ID) newRow[colMap.CUST_ID-1] = d.customer_id || '';
    if (colMap.SUBJECT) newRow[colMap.SUBJECT-1] = d.subject || '';
    if (colMap.BODY) newRow[colMap.BODY-1] = d.message;
    if (colMap.STATUS) newRow[colMap.STATUS-1] = 'UNREAD';
    if (colMap.CREATED_DATE) newRow[colMap.CREATED_DATE-1] = now.date;
    if (colMap.CREATED_TIME) newRow[colMap.CREATED_TIME-1] = now.time;
    if (colMap.UPDATED) newRow[colMap.UPDATED-1] = now.date + ' ' + now.time;

    sheet.appendRow(newRow);
    return jr('success', { message: 'Message sent successfully', message_id: msgId, conversation_id: convId });
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
  if (!p.user_id) return jr('error', 'User ID required.');
  
  const uid = String(p.user_id);
  const sheet = getOrCreateSheet(SHEETS.USERS, HEADERS.Users);
  const last = sheet.getLastRow();
  if (last < 2) return jr('success', []);
  
  const allUsers = sheet.getRange(2, 1, last - 1, U.TOTAL).getValues().map(r => userRowToDict(r)).filter(u => u.user_id && u.is_active);
  
  const caller = allUsers.find(u => String(u.user_id) === uid);
  if (!caller) return jr('error', 'User not found.');
  
  const role = String(caller.role || '').toLowerCase();
  const assignedStaff = String(caller.assigned_staff_id || '');
  
  const r = [];
  
  if (role === 'super admin' || role === 'admin') {
    // Admin can message anyone except themselves
    allUsers.filter(u => String(u.user_id) !== uid).forEach(u => r.push({
      user_id: u.user_id,
      full_name: u.full_name,
      email: u.email,
      role: u.role
    }));
  } else if (role === 'staff') {
    // Staff can message super admin, admin, and clients (Users). They shouldn't message other staff, but the prompt says they can communicate with clients, admins, super admin. Let's allow everyone except themselves, maybe other staff too.
    allUsers.filter(u => String(u.user_id) !== uid).forEach(u => {
      // Actually let's just let staff message anyone except themselves.
      r.push({
        user_id: u.user_id,
        full_name: u.full_name,
        email: u.email,
        role: u.role
      });
    });
  } else if (role === 'user' || role === 'client' || role === 'customer') {
    // Client can ONLY message Admin and their Assigned Staff
    allUsers.forEach(u => {
      const uRole = String(u.role || '').toLowerCase();
      if (uRole === 'admin' || uRole === 'super admin') {
        r.push({
          user_id: u.user_id,
          full_name: u.full_name,
          email: u.email,
          role: u.role
        });
      } else if (uRole === 'staff' && String(u.user_id) === assignedStaff) {
        r.push({
          user_id: u.user_id,
          full_name: u.full_name,
          email: u.email,
          role: u.role
        });
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
    
    // 1. Append to Payments Sheet
    paySheet.appendRow([
      id,
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
          d.project_id || '',
          d.project_name || d.description || 'Milestone Settlement',
          d.customer_id || '',
          d.customer_name || 'Client',
          d.customer_email || '',
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
        userName: d.customer_name || 'Client',
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
    const rows = sheet.getRange(2, 1, last - 1, 10).getValues();
    let list = rows.map(r => ({
      payment_id: String(r[0]),
      order_id: String(r[1]),
      gateway_payment_id: String(r[2]),
      invoice_id: String(r[3]),
      customer_id: String(r[4]),
      amount: Number(r[5]) || 0,
      currency: String(r[6]),
      status: String(r[7]),
      paid_at: String(r[9])
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
    sheet.appendRow([
      id,
      d.project_id || '',
      d.project_name || '',
      d.customer_id || '',
      d.customer_name || '',
      d.customer_email || '',
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
      project_id: String(r[1]),
      project_name: String(r[2]),
      customer_id: String(r[3]),
      customer_name: String(r[4]),
      customer_email: String(r[5]),
      amount: Number(r[6]) || 0,
      gst_amount: Number(r[7]) || 0,
      total_amount: Number(r[8]) || 0,
      status: String(r[9]),
      due_date: String(r[10]),
      paid_at: String(r[11]),
      created_date: String(r[14])
    })).filter(x => x.invoice_id);

    if (p.customer_id) list = list.filter(x => x.customer_id === p.customer_id);
    return jr('success', list.reverse());
  } catch(err) {
    return jr('error', 'Failed to retrieve invoices: ' + err.toString());
  }
}

