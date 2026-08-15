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
  BUSINESS_EMAIL  : 'venun4548@gmail.com',
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
  UPDATES:'ProjectUpdates', ACTIVITY:'ActivityLogs'
};

// Column indexes (1-based)
const U={ID:1,NAME:2,EMAIL:3,MOBILE:4,PASS:5,ROLE:6,STATUS:7,CREATED_DATE:8,CREATED_TIME:9,LAST_LOGIN_DATE:10,LAST_LOGIN_TIME:11,LAST_ACT_DATE:12,LAST_ACT_TIME:13,UPD_DATE:14,UPD_TIME:15,ASSIGNED_STAFF:16,TOTAL:16};
const M={ID:1,CONV_ID:2,SENDER_ID:3,SENDER_NAME:4,SENDER_ROLE:5,RECV_ID:6,RECV_NAME:7,RECV_ROLE:8,RECIP_TYPE:9,MSG_TYPE:10,PROJ_ID:11,CUST_ID:12,SUBJECT:13,BODY:14,ATTACH:15,STATUS:16,READ_AT:17,CREATED_DATE:18,CREATED_TIME:19,UPDATED:20,TOTAL:20};
const E={ID:1,CUST_ID:2,CUST_NAME:3,EMAIL:4,MOBILE:5,ADDRESS:6,MESSAGE:7,STATUS:8,PROJ_ID:9,CREATED_DATE:10,CREATED_TIME:11,UPD_DATE:12,UPD_TIME:13,TOTAL:13};
const P={ID:1,CUST_ID:2,CUST_NAME:3,PROJ_NAME:4,DESC:5,STAGE:6,PROGRESS:7,DELIVERY:8,STATUS:9,CREATED_BY:10,CREATED_DATE:11,CREATED_TIME:12,UPD_DATE:13,UPD_TIME:14,LATEST_UPDATE:15,TOTAL:15};
const A={ID:1,PROJ_ID:2,STAFF_ID:3,STAFF_NAME:4,ASSIGNED_BY:5,ASSIGNED_DATE:6,ASSIGNED_TIME:7,UNASSIGNED_DATE:8,STATUS:9,TOTAL:9};
const PU={ID:1,PROJ_ID:2,STAFF_ID:3,STAFF_NAME:4,STAGE:5,PROGRESS:6,TEXT:7,REMARK:8,CREATED_DATE:9,CREATED_TIME:10,TOTAL:10};
const AL={ID:1,USER_ID:2,USER_NAME:3,ROLE:4,ACTION:5,RELATED_ID:6,DESC:7,DATE:8,TIME:9,STATUS:10,TOTAL:10};

const HEADERS={
  Users:['User ID','Full Name','Email','Mobile Number','Password Hash','Role','Status','Created Date','Created Time','Last Login Date','Last Login Time','Last Activity Date','Last Activity Time','Updated Date','Updated Time','Assigned Staff ID'],
  Messages:['Message ID','Conversation ID','Sender ID','Sender Name','Sender Role','Receiver ID','Receiver Name','Receiver Role','Recipient Type','Message Type','Project ID','Customer ID','Subject','Message','Attachment URL','Status','Read At','Created Date','Created Time','Last Updated'],
  Enquiries:['Enquiry ID','Customer ID','Customer Name','Email','Mobile','Address','Message','Status','Project ID','Created Date','Created Time','Updated Date','Updated Time'],
  Projects:['Project ID','Customer ID','Customer Name','Project Name','Description','Current Stage','Progress','Expected Delivery Date','Status','Created By','Created Date','Created Time','Updated Date','Updated Time','Latest Update'],
  ProjectAssignments:['Assignment ID','Project ID','Staff ID','Staff Name','Assigned By','Assigned Date','Assigned Time','Unassigned Date','Status'],
  ProjectUpdates:['Update ID','Project ID','Staff ID','Staff Name','Stage','Progress','Update Text','Remark','Created Date','Created Time'],
  ActivityLogs:['Activity ID','User ID','User Name','Role','Action','Related ID','Description','Date','Time','Status']
};

// ─────────────── SETUP ────────────────────────────────────────
function initialSetup(){
  Logger.log('Initializing Website Builders Sheets...');
  Object.keys(HEADERS).forEach(n=>{getOrCreateSheet(n,HEADERS[n]);Logger.log('Sheet ready: '+n);});
  Logger.log('All 7 sheets initialized.');
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
      if(action==='createProject')    return createProject(data);
      if(action==='updateProject')    return updateProject(data);
      if(action==='assignStaff')      return assignStaff(data);
      if(action==='reassignStaff')    return reassignStaff(data);
      if(action==='addProjectUpdate') return addProjectUpdate(data);
      if(action==='sendMessage')      return sendMessage(data);
      if(action==='markMessageRead')  return markMessageRead(data);
      if(action==='logActivity')      return logActivity(data);
      if(action==='sync_user')        return syncLegacyUser(data);
      if(action==='sync_message')     return sendMessage({sender_id:data.sender_id,sender_name:data.sender_name,sender_role:data.sender_role,receiver_id:data.receiver_id,receiver_name:data.receiver_name,receiver_role:data.receiver_role,conversation_id:data.conversation_id,body:data.body||data.message,subject:data.subject,project_id:data.project_id,customer_id:data.customer_id,recipient_type:data.recipient_type,message_type:data.message_type});
      if(action==='sync_audit')       return logActivity({userId:'',userName:data.user_email||'',role:'',action:data.action||'AUDIT',relatedId:'',description:data.action||'',status:data.status||'SUCCESS'});
      if(action==='update_enquiry')   return updateEnquiry({enquiry_id:p.submissionId,status:p.ticketStatus});
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
    if(action==='getMessages')          return getMessages(p);
    if(action==='getConversations')     return getConversations(p);
    if(action==='getConversationThread')return getConversationThread(p);
    if(action==='getActivityLogs')      return getActivityLogs(p);
    if(action==='getStats')             return getStats(p);
    if(action==='getRecipients')        return getRecipients(p);
    if(action==='getConvWithUser')      return getConvWithUser(p);
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

function getUsers(p){
  const sheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
  const last=sheet.getLastRow();
  if(last<2) return jr('success',[]);
  let users=sheet.getRange(2,1,last-1,U.TOTAL).getValues().map(r=>userRowToDict(r)).filter(u=>u.user_id);
  if(p.role)        users=users.filter(u=>u.role.toLowerCase()===p.role.toLowerCase());
  if(p.status)      users=users.filter(u=>u.status.toLowerCase()===p.status.toLowerCase());
  if(p.active_only==='true') users=users.filter(u=>u.status.toUpperCase()==='ACTIVE');
  return jr('success',users);
}

function getUser(p){
  const sheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);
  const row=p.user_id?findRowByValue(sheet,U.ID,p.user_id):(p.email?findRowByValue(sheet,U.EMAIL,p.email.toLowerCase()):-1);
  if(row<0) return jr('error','User not found.');
  return jr('success',userRowToDict(sheet.getRange(row,1,1,U.TOTAL).getValues()[0]));
}

function userRowToDict(r){
  return{user_id:String(r[U.ID-1]),id:String(r[U.ID-1]),full_name:String(r[U.NAME-1]),email:String(r[U.EMAIL-1]),mobile:String(r[U.MOBILE-1]),role:String(r[U.ROLE-1]),status:String(r[U.STATUS-1]),is_active:String(r[U.STATUS-1]).toUpperCase()==='ACTIVE',created_at:String(r[U.CREATED_DATE-1])+' '+String(r[U.CREATED_TIME-1]),last_login:String(r[U.LAST_LOGIN_DATE-1])+' '+String(r[U.LAST_LOGIN_TIME-1]),last_activity:String(r[U.LAST_ACT_DATE-1])+' '+String(r[U.LAST_ACT_TIME-1]),updated_at:String(r[U.UPD_DATE-1])+' '+String(r[U.UPD_TIME-1]),assigned_staff_id:String(r[U.ASSIGNED_STAFF-1]||'')};
}

// ─────────────── ENQUIRIES ────────────────────────────────────
function createEnquiry(d){
  d = d || {};
  if(!d.email||!d.customer_name) return jr('error','Name and email required.');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const sheet=getOrCreateSheet(SHEETS.ENQUIRIES,HEADERS.Enquiries);
    const now=getNow();const enqId=generateId('ENQ',SHEETS.ENQUIRIES,E.ID);
    sheet.appendRow([enqId,d.customer_id||'',d.customer_name.trim(),d.email.trim().toLowerCase(),(d.mobile||'').trim(),(d.address||'').trim(),(d.message||'').trim(),'New',d.project_id||'',now.date,now.time,'','']);
    logActivity({userId:d.customer_id||'',userName:d.customer_name,role:'User',action:'ENQUIRY_CREATED',relatedId:enqId,description:'New enquiry',status:'SUCCESS'});
    try{sendOwnerEnquiryEmail(enqId,d.customer_name,d.email,d.mobile,d.address,d.message);}catch(e){}
    return jr('success',{id:enqId,enquiry_id:enqId,message:'Enquiry created.'});
  }finally{lock.releaseLock();}
}

function updateEnquiry(d){
  d = d || {};
  if(!d.enquiry_id) return jr('error','Enquiry ID required.');
  const sheet=getOrCreateSheet(SHEETS.ENQUIRIES,HEADERS.Enquiries);
  const row=findRowByValue(sheet,E.ID,d.enquiry_id);
  if(row<0) return jr('error','Enquiry not found.');
  const now=getNow();
  if(d.status)     sheet.getRange(row,E.STATUS).setValue(d.status);
  if(d.project_id) sheet.getRange(row,E.PROJ_ID).setValue(d.project_id);
  sheet.getRange(row,E.UPD_DATE).setValue(now.date);
  sheet.getRange(row,E.UPD_TIME).setValue(now.time);
  return jr('success',{message:'Enquiry updated.'});
}

function getEnquiries(p){
  const sheet=getOrCreateSheet(SHEETS.ENQUIRIES,HEADERS.Enquiries);
  const last=sheet.getLastRow();
  if(last<2) return jr('success',[]);
  let list=sheet.getRange(2,1,last-1,E.TOTAL).getValues().map(r=>({enquiry_id:String(r[E.ID-1]),id:String(r[E.ID-1]),customer_id:String(r[E.CUST_ID-1]),customer_name:String(r[E.CUST_NAME-1]),name:String(r[E.CUST_NAME-1]),email:String(r[E.EMAIL-1]),mobile:String(r[E.MOBILE-1]),address:String(r[E.ADDRESS-1]),message:String(r[E.MESSAGE-1]),status:String(r[E.STATUS-1]),project_id:String(r[E.PROJ_ID-1]),created_at:String(r[E.CREATED_DATE-1])+' '+String(r[E.CREATED_TIME-1]),updated_at:String(r[E.UPD_DATE-1])+' '+String(r[E.UPD_TIME-1])})).filter(e=>e.enquiry_id);
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
  const sheet=getOrCreateSheet(SHEETS.PROJECTS,HEADERS.Projects);
  const last=sheet.getLastRow();
  if(last<2) return jr('success',[]);
  let list=sheet.getRange(2,1,last-1,P.TOTAL).getValues().map(r=>({project_id:String(r[P.ID-1]),id:String(r[P.ID-1]),customer_id:String(r[P.CUST_ID-1]),customer_name:String(r[P.CUST_NAME-1]),project_name:String(r[P.PROJ_NAME-1]),name:String(r[P.PROJ_NAME-1]),description:String(r[P.DESC-1]),stage:String(r[P.STAGE-1]),progress:parseInt(r[P.PROGRESS-1])||0,expected_delivery:String(r[P.DELIVERY-1]),status:String(r[P.STATUS-1]),created_by:String(r[P.CREATED_BY-1]),created_at:String(r[P.CREATED_DATE-1])+' '+String(r[P.CREATED_TIME-1]),updated_at:String(r[P.UPD_DATE-1])+' '+String(r[P.UPD_TIME-1]),latest_update:String(r[P.LATEST_UPDATE-1])})).filter(pr=>pr.project_id);
  if(p.customer_id) list=list.filter(pr=>pr.customer_id===p.customer_id);
  if(p.status)      list=list.filter(pr=>pr.status.toLowerCase()===p.status.toLowerCase());
  if(p.staff_id){
    const as=getOrCreateSheet(SHEETS.ASSIGNMENTS,HEADERS.ProjectAssignments);
    const aLast=as.getLastRow();
    if(aLast>=2){
      const aRows=as.getRange(2,1,aLast-1,A.TOTAL).getValues();
      const ids=aRows.filter(r=>String(r[A.STAFF_ID-1])===p.staff_id&&String(r[A.STATUS-1]).toUpperCase()==='ACTIVE').map(r=>String(r[A.PROJ_ID-1]));
      list=list.filter(pr=>ids.includes(pr.project_id));
    }else{list=[];}
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
    sheet.appendRow([asgId,d.project_id,d.staff_id,d.staff_name||'',d.assigned_by||'',now.date,now.time,'','ACTIVE']);
    logActivity({userId:d.staff_id,userName:d.staff_name||'',role:'Staff',action:'PROJECT_ASSIGNED',relatedId:d.project_id,description:'Assigned to '+d.project_id,status:'SUCCESS'});
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
  const sheet=getOrCreateSheet(SHEETS.UPDATES,HEADERS.ProjectUpdates);
  const last=sheet.getLastRow();
  if(last<2) return jr('success',[]);
  let list=sheet.getRange(2,1,last-1,PU.TOTAL).getValues().map(r=>({update_id:String(r[PU.ID-1]),project_id:String(r[PU.PROJ_ID-1]),staff_id:String(r[PU.STAFF_ID-1]),staff_name:String(r[PU.STAFF_NAME-1]),stage:String(r[PU.STAGE-1]),progress:parseInt(r[PU.PROGRESS-1])||0,update_text:String(r[PU.TEXT-1]),remark:String(r[PU.REMARK-1]),created_at:String(r[PU.CREATED_DATE-1])+' '+String(r[PU.CREATED_TIME-1])})).filter(u=>u.update_id);
  if(p.project_id) list=list.filter(u=>u.project_id===p.project_id);
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

function getRecipients(p){
  const role=(p.role||'').toLowerCase();const uid=String(p.user_id||'');
  const sheet=getOrCreateSheet(SHEETS.USERS,HEADERS.Users);const last=sheet.getLastRow();
  if(last<2) return jr('success',[]);
  const users=sheet.getRange(2,1,last-1,U.TOTAL).getValues().map(r=>userRowToDict(r)).filter(u=>u.user_id&&u.is_active&&u.user_id!==uid);
  const r=[];
  if(role==='super admin'||role==='admin'){users.forEach(u=>r.push({id:u.user_id,name:u.full_name,email:u.email,role:u.role,type:'INDIVIDUAL'}));r.push({id:'TEAM_OPERATIONS',name:'Operations Staff Team',role:'TEAM',type:'TEAM'});}
  else if(role==='staff'){users.filter(u=>['Super Admin','Admin'].includes(u.role)).forEach(u=>r.push({id:u.user_id,name:u.full_name,email:u.email,role:u.role,type:'INDIVIDUAL'}));r.push({id:'TEAM_OPERATIONS',name:'Operations Team',role:'TEAM',type:'TEAM'});}
  else{users.filter(u=>['Super Admin','Admin','Staff'].includes(u.role)).forEach(u=>r.push({id:u.user_id,name:u.full_name,email:u.email,role:u.role,type:'INDIVIDUAL'}));}
  return jr('success',r);
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
  if(eL>=2){es.getRange(2,1,eL-1,E.TOTAL).getValues().forEach(r=>{te++;if(String(r[E.STATUS-1])==='New')ne++;});}
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

// ─────────────── CONTACT FORM ─────────────────────────────────
// Sheet1 = original mail-automation sheet (NEVER modified by initialSetup)
// Enquiries = new CRM copy for the dashboard
// Both receive every public contact form submission.

// Legacy column map for Sheet1 (matches the original spreadsheet exactly)
const COL={SUBMISSION_ID:1,TIMESTAMP:2,CUSTOMER_NAME:3,EMAIL:4,MOBILE_NUMBER:5,ADDRESS:6,MESSAGE:7,EMAIL_STATUS:8,EMAIL_SENT_AT:9,OWNER_NOTIF_STAT:10,OWNER_NOTIF_TIME:11,TICKET_STATUS:12,ASSIGNED_TO:13,FOLLOWUP_DATE:14,FOLLOWUP_STATUS:15,SOURCE_PAGE:16,REMARKS:17};

function handleContactForm(params){
  const lock=LockService.getScriptLock();
  try{lock.waitLock(15000);}catch(err){return jr('error','Server busy.');}
  try{
    const name=(params.name||'').trim();
    const email=(params.email||'').trim().toLowerCase();
    const mobile=(params.mobile||'').trim();
    const address=(params.address||'').trim();
    const message=(params.message||'').trim();
    const source=(params.sourcePage||'Contact Page').trim();
    if(!name||!email||!mobile||!message) return jr('error','All required fields must be completed.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jr('error','Invalid email address format.');

    const ss=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    // ── Write to Sheet1 (original mail-automation sheet) ─────────
    // Uses the same column layout as the original script — Sheet1 is NOT touched elsewhere.
    const sheet1=ss.getSheetByName('Sheet1')||ss.getSheets()[0];
    const submissionId=generateSheet1Id(sheet1);
    const timestampStr=Utilities.formatDate(new Date(),CONFIG.TIMEZONE,'dd-MMM-yyyy hh:mm:ss a');
    const followUpDate=new Date();followUpDate.setDate(followUpDate.getDate()+3);
    const followUpDateStr=Utilities.formatDate(followUpDate,CONFIG.TIMEZONE,'dd-MMM-yyyy');

    const newRow=[];
    newRow[COL.SUBMISSION_ID-1]=submissionId;
    newRow[COL.TIMESTAMP-1]=timestampStr;
    newRow[COL.CUSTOMER_NAME-1]=name;
    newRow[COL.EMAIL-1]=email;
    newRow[COL.MOBILE_NUMBER-1]=mobile;
    newRow[COL.ADDRESS-1]=address;
    newRow[COL.MESSAGE-1]=message;
    newRow[COL.EMAIL_STATUS-1]='Pending';
    newRow[COL.EMAIL_SENT_AT-1]='';
    newRow[COL.OWNER_NOTIF_STAT-1]='Pending';
    newRow[COL.OWNER_NOTIF_TIME-1]='';
    newRow[COL.TICKET_STATUS-1]='New';
    newRow[COL.ASSIGNED_TO-1]='';
    newRow[COL.FOLLOWUP_DATE-1]=followUpDateStr;
    newRow[COL.FOLLOWUP_STATUS-1]='Pending';
    newRow[COL.SOURCE_PAGE-1]=source;
    newRow[COL.REMARKS-1]='';
    sheet1.appendRow(newRow);
    const rowIndex=sheet1.getLastRow();

    // Send owner notification email and update Sheet1 status
    let ownerStatus='Sent',ownerTime='',remarks='';
    try{
      sendOwnerEnquiryEmail(submissionId,name,email,mobile,address,message);
      ownerTime=Utilities.formatDate(new Date(),CONFIG.TIMEZONE,'dd-MMM-yyyy hh:mm:ss a');
    }catch(err){ownerStatus='Failed';remarks='Owner email failed: '+err.toString();}
    sheet1.getRange(rowIndex,COL.OWNER_NOTIF_STAT).setValue(ownerStatus);
    if(ownerTime) sheet1.getRange(rowIndex,COL.OWNER_NOTIF_TIME).setValue(ownerTime);
    if(remarks)   sheet1.getRange(rowIndex,COL.REMARKS).setValue(remarks);

    // ── Also write to Enquiries sheet (CRM copy) ─────────────────
    try{
      const eSheet=getOrCreateSheet(SHEETS.ENQUIRIES,HEADERS.Enquiries);
      const now=getNow();const enqId=generateId('ENQ',SHEETS.ENQUIRIES,E.ID);
      eSheet.appendRow([enqId,'',name,email,mobile,address,message,'New','',now.date,now.time,'','']);
    }catch(err){Logger.log('Enquiries write failed (non-fatal): '+err.toString());}

    lock.releaseLock();
    const trigger=ScriptApp.newTrigger('sendScheduledCustomerEmail').timeBased().after(CONFIG.DELAY_MINUTES*60*1000).create();
    PropertiesService.getScriptProperties().setProperty('trigger_'+trigger.getUniqueId(),JSON.stringify({name,email,enqId:submissionId,message}));
    return jr('success',{message:'Enquiry submitted successfully.',submissionId});
  }catch(err){if(lock.hasLock())lock.releaseLock();return jr('error','Submission failed: '+err.toString());}
}

function sendScheduledCustomerEmail(e){
  const tid=e.triggerUid;const props=PropertiesService.getScriptProperties();const raw=props.getProperty('trigger_'+tid);
  if(!raw){cleanTrigger(tid);return;}
  try{const d=JSON.parse(raw);GmailApp.sendEmail(d.email,'Thank You for Contacting Website Builders','',{htmlBody:buildEmailTemplate(d.name,d.enqId,d.message),name:CONFIG.BUSINESS_NAME,replyTo:CONFIG.BUSINESS_EMAIL});}
  catch(err){Logger.log('Email failed: '+err.toString());}finally{cleanTrigger(tid);}
}

function sendOwnerEnquiryEmail(enqId,name,email,mobile,address,message){
  try{GmailApp.sendEmail(CONFIG.BUSINESS_EMAIL,'New Enquiry - '+enqId,'',{htmlBody:`<div style="font-family:Arial,sans-serif;padding:24px;"><h2 style="color:#1d4ed8;">New Enquiry — ${enqId}</h2><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Mobile:</b> ${mobile}</p><p><b>Address:</b> ${address||'N/A'}</p><div style="background:#f8fafc;padding:16px;border-left:4px solid #1d4ed8;margin-top:16px;"><b>Message:</b><p>${message}</p></div></div>`,name:'Website Builders Alerts'});}catch(e){}
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
