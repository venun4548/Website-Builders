import re

file_path = '../google-app-script.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update SHEETS constant
sheets_target = """  TICKET_MESSAGES:'TicketMessages', BRAND_INFO:'BrandInfo'
};"""
sheets_replacement = """  TICKET_MESSAGES:'TicketMessages', BRAND_INFO:'BrandInfo',
  STAGE_HISTORY:'StageHistory', LEADS:'Leads', LEAD_NOTES:'LeadNotes',
  PORTFOLIO:'Portfolio', PRICING:'Pricing', NOTIFICATIONS:'Notifications',
  PASSWORD_RESETS:'PasswordResets', EMAIL_VERIFICATIONS:'EmailVerifications'
};"""
content = content.replace(sheets_target, sheets_replacement)

# 2. Add Column indexes
col_target = """const HEADERS={"""
col_replacement = """const SH={ID:1, PROJ_ID:2, OLD_STAGE:3, NEW_STAGE:4, CHANGED_BY:5, TIMESTAMP:6, REMARKS:7, TOTAL:7};
const LD={ID:1, NAME:2, EMAIL:3, PHONE:4, COMPANY:5, STATUS:6, SOURCE:7, ASSIGNED_TO:8, CREATED_AT:9, UPDATED_AT:10, TOTAL:10};
const LN={ID:1, LEAD_ID:2, USER_ID:3, NOTE:4, CREATED_AT:5, TOTAL:5};
const PT={ID:1, TITLE:2, DESC:3, IMAGE:4, LINK:5, CATEGORY:6, SORT_ORDER:7, CREATED_AT:8, TOTAL:8};
const PR={ID:1, NAME:2, DESC:3, PRICE:4, FEATURES:5, STATUS:6, CREATED_AT:7, UPDATED_AT:8, TOTAL:8};
const NT={ID:1, USER_ID:2, TITLE:3, MESSAGE:4, LINK:5, IS_READ:6, CREATED_AT:7, TOTAL:7};
const PW={ID:1, USER_ID:2, TOKEN:3, EXPIRES_AT:4, USED:5, CREATED_AT:6, TOTAL:6};
const EV={ID:1, USER_ID:2, TOKEN:3, EXPIRES_AT:4, VERIFIED:5, CREATED_AT:6, TOTAL:6};

const HEADERS={"""
content = content.replace(col_target, col_replacement)

# 3. Add HEADERS
headers_target = """  BrandInfo:['Brand ID','User ID','Brand Name','Tagline','Primary Color','Secondary Color','Font Family','Target Audience','Competitors','Brand Values','Assets URL','Updated At']
};"""
headers_replacement = """  BrandInfo:['Brand ID','User ID','Brand Name','Tagline','Primary Color','Secondary Color','Font Family','Target Audience','Competitors','Brand Values','Assets URL','Updated At'],
  StageHistory:['Stage History ID','Project ID','Old Stage','New Stage','Changed By','Timestamp','Remarks'],
  Leads:['Lead ID','Name','Email','Phone','Company','Status','Source','Assigned To','Created At','Updated At'],
  LeadNotes:['Note ID','Lead ID','User ID','Note Text','Created At'],
  Portfolio:['Portfolio ID','Title','Description','Image URL','Link','Category','Sort Order','Created At'],
  Pricing:['Plan ID','Plan Name','Description','Price','Features','Status','Created At','Updated At'],
  Notifications:['Notification ID','User ID','Title','Message','Link','Is Read','Created At'],
  PasswordResets:['Reset ID','User ID','Token','Expires At','Used','Created At'],
  EmailVerifications:['Verification ID','User ID','Token','Expires At','Verified','Created At']
};"""
content = content.replace(headers_target, headers_replacement)

# 4. Add NEW_SHEETS in createAllPaymentAndRemainingSheets
new_sheets_target = """    'BrandInfo': ['Brand ID','User ID','Brand Name','Tagline','Primary Color','Secondary Color','Font Family','Target Audience','Competitors','Brand Values','Assets URL','Updated At']
  };"""
new_sheets_replacement = """    'BrandInfo': ['Brand ID','User ID','Brand Name','Tagline','Primary Color','Secondary Color','Font Family','Target Audience','Competitors','Brand Values','Assets URL','Updated At'],
    'StageHistory':['Stage History ID','Project ID','Old Stage','New Stage','Changed By','Timestamp','Remarks'],
    'Leads':['Lead ID','Name','Email','Phone','Company','Status','Source','Assigned To','Created At','Updated At'],
    'LeadNotes':['Note ID','Lead ID','User ID','Note Text','Created At'],
    'Portfolio':['Portfolio ID','Title','Description','Image URL','Link','Category','Sort Order','Created At'],
    'Pricing':['Plan ID','Plan Name','Description','Price','Features','Status','Created At','Updated At'],
    'Notifications':['Notification ID','User ID','Title','Message','Link','Is Read','Created At'],
    'PasswordResets':['Reset ID','User ID','Token','Expires At','Used','Created At'],
    'EmailVerifications':['Verification ID','User ID','Token','Expires At','Verified','Created At']
  };"""
content = content.replace(new_sheets_target, new_sheets_replacement)

# 5. Add routes to doPost
dopost_target = """      if(action==='update_enquiry')   return updateEnquiry({enquiry_id:p.submissionId,status:p.ticketStatus,assigned_to:p.assignedTo});
    }catch(err){return jr('error','Action failed: '+err.toString());}"""
dopost_replacement = """      if(action==='update_enquiry')   return updateEnquiry({enquiry_id:p.submissionId,status:p.ticketStatus,assigned_to:p.assignedTo});
      
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

    }catch(err){return jr('error','Action failed: '+err.toString());}"""
content = content.replace(dopost_target, dopost_replacement)

# 6. Add routes to doGet
doget_target = """    if(action==='getPayments')          return getPayments(p);
  }catch(err){return jr('error','Read failed: '+err.toString());}"""
doget_replacement = """    if(action==='getPayments')          return getPayments(p);
    
    // NEW ENTITIES GET
    if(action==='getStageHistory')      return getStageHistory(p);
    if(action==='getLeads')             return getLeads(p);
    if(action==='getLeadNotes')         return getLeadNotes(p);
    if(action==='getPortfolio')         return getPortfolio(p);
    if(action==='getPricing')           return getPricing(p);
    if(action==='getNotifications')     return getNotifications(p);
    if(action==='getPasswordResets')    return getPasswordResets(p);
    if(action==='getEmailVerifications')return getEmailVerifications(p);

  }catch(err){return jr('error','Read failed: '+err.toString());}"""
content = content.replace(doget_target, doget_replacement)


# 7. Add actual functions at the end of the file
new_funcs = """
// =======================================================
// NEW ENTITIES FUNCTIONS
// =======================================================

function createStageHistory(d) {
  const sheet = getOrCreateSheet(SHEETS.STAGE_HISTORY, HEADERS.StageHistory);
  const id = generateId('SH', SHEETS.STAGE_HISTORY, SH.ID);
  const now = getNow();
  sheet.appendRow([id, d.project_id||'', d.old_stage||'', d.new_stage||'', d.changed_by||'', now.date + ' ' + now.time, d.remarks||'']);
  return jr('success', {id: id});
}
function getStageHistory(p) {
  const sheet = getOrCreateSheet(SHEETS.STAGE_HISTORY, HEADERS.StageHistory);
  const rows = sheet.getDataRange().getValues();
  let res = [];
  for(let i=1; i<rows.length; i++) {
    if(p.project_id && String(rows[i][SH.PROJ_ID-1]) !== String(p.project_id)) continue;
    res.push({
      id: rows[i][SH.ID-1], project_id: rows[i][SH.PROJ_ID-1],
      old_stage: rows[i][SH.OLD_STAGE-1], new_stage: rows[i][SH.NEW_STAGE-1],
      changed_by: rows[i][SH.CHANGED_BY-1], timestamp: rows[i][SH.TIMESTAMP-1],
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

"""

if "// NEW ENTITIES FUNCTIONS" not in content:
    content += new_funcs

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched successfully!")
