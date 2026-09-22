import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const SHEETS = {
  Users: [
    'id', 'email', 'passwordHash', 'name', 'company', 'role',
    'isEmailVerified', 'onboardingComplete', 'brandName', 'brandTagline',
    'primaryColor', 'fontPreference', 'targetAudience', 'assignedStaff',
    'twoFactorEnabled', 'twoFactorSecret', 'createdAt', 'updatedAt'
  ],
  Projects: [
    'id', 'clientId', 'clientName', 'clientEmail', 'name', 'tier',
    'stage', 'progress', 'assignedStaff', 'estimatedLaunch',
    'actualLaunch', 'createdAt', 'updatedAt'
  ],
  StageHistory: [
    'id', 'projectId', 'clientName', 'clientEmail', 'stage', 'changedBy', 'notes', 'timestamp'
  ],
  Invoices: [
    'id', 'projectId', 'projectName', 'clientId', 'clientName', 'clientEmail',
    'amount', 'gstAmount', 'totalAmount', 'status', 'dueDate',
    'paidAt', 'razorpayOrderId', 'razorpayPaymentId', 'createdAt', 'updatedAt'
  ],
  InvoiceItems: [
    'id', 'invoiceId', 'description', 'quantity', 'rate', 'amount'
  ],
  Files: [
    'id', 'projectId', 'clientName', 'clientEmail', 'uploadedBy', 'fileName', 'fileUrl',
    'fileSize', 'fileType', 'category', 'uploadedAt'
  ],
  Tasks: [
    'id', 'clientName', 'clientEmail', 'projectId', 'projectName',
    'taskTitle', 'description', 'assignedStaffId', 'assignedStaffName',
    'priority', 'status', 'dueDate', 'createdBy', 'createdAt', 'updatedAt'
  ],
  Tickets: [
    'id', 'clientId', 'clientName', 'clientEmail', 'subject',
    'priority', 'status', 'assignedTo', 'createdAt', 'updatedAt'
  ],
  TicketMessages: [
    'id', 'ticketId', 'senderEmail', 'senderRole', 'message', 'timestamp'
  ],
  Leads: [
    'id', 'name', 'email', 'phone', 'service', 'budget', 'message',
    'status', 'assignedTo', 'convertedProjectId', 'createdAt', 'updatedAt'
  ],
  LeadNotes: [
    'id', 'leadId', 'authorEmail', 'note', 'timestamp'
  ],
  Portfolio: [
    'id', 'title', 'category', 'description', 'imageUrl', 'liveUrl',
    'clientName', 'displayOrder', 'featured', 'createdAt', 'updatedAt'
  ],
  Pricing: [
    'id', 'tier', 'price', 'billing', 'description', 'features',
    'highlighted', 'displayOrder', 'createdAt', 'updatedAt'
  ],
  Notifications: [
    'id', 'userId', 'role', 'type', 'title', 'message', 'relatedId',
    'relatedType', 'url', 'link', 'read', 'createdAt', 'readAt'
  ],
  AuditLog: [
    'id', 'timestamp', 'actorEmail', 'actorRole', 'action',
    'resourceType', 'resourceId', 'resourceName', 'details', 'ipAddress'
  ],
  AuditLogs: [
    'id', 'actorId', 'actorRole', 'action', 'entityType', 'entityId',
    'description', 'ipHash', 'userAgent', 'createdAt'
  ],
  PasswordResets: [
    'id', 'userId', 'token', 'expiresAt', 'used', 'createdAt'
  ],
  EmailVerifications: [
    'id', 'userId', 'token', 'expiresAt', 'used', 'createdAt'
  ],
  ContactSubmissions: [
    'id', 'name', 'email', 'phone', 'service', 'message',
    'submittedAt', 'convertedToLead'
  ],
  BrandInfo: [
    'id', 'userId', 'clientName', 'clientEmail', 'brandName', 'tagline', 'primaryColor',
    'secondaryColor', 'fontFamily', 'targetAudience', 'competitors',
    'brandValues', 'existingWebsite', 'assetsUrl', 'updatedAt'
  ],
  PushSubscriptions: [
    'id', 'userId', 'role', 'email', 'endpoint', 'p256dh',
    'auth', 'device', 'browser', 'createdAt', 'lastUsedAt', 'active'
  ],
  MonthlyReports: [
    'id', 'clientId', 'clientName', 'clientEmail', 'projectId', 'projectName',
    'month', 'year', 'fileName', 'generatedAt', 'generatedBy', 'sentAt',
    'emailStatus', 'status'
  ],
  EmailLogs: [
    'id', 'recipient', 'recipientName', 'type', 'subject', 'relatedId',
    'sentAt', 'status', 'error', 'retryCount'
  ],
  InvoiceReminderLogs: [
    'id', 'invoiceId', 'clientId', 'clientName', 'clientEmail', 'type', 'scheduledDate', 'sentAt', 'status'
  ],
  LeadFollowUpLogs: [
    'id', 'leadId', 'recipient', 'reminderDate', 'lastActivityAt', 'sentAt', 'status'
  ],
  DeadlineAlertLogs: [
    'id', 'projectId', 'clientName', 'clientEmail', 'alertType', 'scheduledDate', 'recipientId', 'sentAt', 'status'
  ],
  AbandonedContacts: [
    'id', 'sessionId', 'email', 'name', 'startedAt', 'lastActivityAt',
    'abandonedAt', 'followUpSent', 'followUpSentAt', 'status'
  ],
  RevisionRequests: [
    'id', 'projectId', 'clientId', 'clientName', 'clientEmail', 'designId', 'designName',
    'description', 'priority', 'status', 'createdAt', 'updatedAt',
    'assignedTo', 'resolvedAt'
  ],
  RevisionAnnotations: [
    'id', 'revisionId', 'type', 'x', 'y', 'width', 'height', 'points', 'text', 'createdAt'
  ],
  SatisfactionSurveys: [
    'id', 'projectId', 'clientId', 'clientName', 'clientEmail', 'token',
    'sentAt', 'openedAt', 'submittedAt', 'status', 'scoreOverall',
    'scoreCommunication', 'scoreQuality', 'scoreTimeliness', 'scoreSupport',
    'recommend', 'comments'
  ],
  MaintenanceRequests: [
    'id', 'projectId', 'clientId', 'clientName', 'clientEmail', 'title',
    'description', 'category', 'priority', 'status', 'assignedTo',
    'assignedStaffName', 'createdAt', 'updatedAt', 'completedAt',
    'estimatedCost', 'approvedCost', 'clientApproval', 'remarks'
  ],
  WebsiteSettings: [
    'id', 'key', 'value', 'updatedAt'
  ],
} as const;

export type SheetName = keyof typeof SHEETS;

export function generateId(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

// Convert column index (0-based) to letter (0 -> A, 1 -> B, etc.)
function colLetter(colIndex: number): string {
  let letter = '';
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

// Helper to determine if Google Sheets live API credentials are configured
function hasGoogleSheetsCredentials(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_PRIVATE_KEY.length > 50 &&
    !process.env.GOOGLE_SHEETS_ID.includes('mock')
  );
}

function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY || '';
  // Handle literal escaped \n in env var
  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

// -------------------------------------------------------------
// Fallback In-Memory / File-based Database for Local Dev & Build
// -------------------------------------------------------------
const MOCK_STORAGE_PATH = path.join(process.cwd(), '.sheets_cache.json');

function loadMockData(): Record<string, Record<string, any>[]> {
  try {
    if (fs.existsSync(MOCK_STORAGE_PATH)) {
      const data = fs.readFileSync(MOCK_STORAGE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read mock sheets cache:', err);
  }

  // Seed default data
  const initialData: Record<string, Record<string, any>[]> = {
    Users: [
      {
        id: 'user_superadmin_01',
        email: 'admin@websitebuilders.com',
        passwordHash: '$2a$12$e8YQ3dC2eM8H40wK8wM0g.3GfB7fDk8B8mQ2rX8wK0vK8wM0g.3Gf', // test pass: Admin@12345
        name: 'Super Admin',
        company: 'Website Builders Co',
        role: 'superadmin',
        isEmailVerified: 'true',
        onboardingComplete: 'true',
        brandName: 'Website Builders',
        brandTagline: 'Engineered for Performance',
        primaryColor: '#6366f1',
        fontPreference: 'Inter',
        targetAudience: 'High-growth businesses',
        assignedStaff: JSON.stringify([]),
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    Pricing: [
      {
        id: 'tier_starter',
        tier: 'Starter',
        price: '14999',
        billing: 'one-time',
        description: 'Ideal for startups, portfolios, and single landing pages.',
        features: JSON.stringify([
          'Up to 5 Responsive Pages',
          'Modern UI/UX Design System',
          'SEO Optimized Structure',
          'Contact Form with Email Alerts',
          '1 Month Post-Launch Support',
        ]),
        highlighted: 'false',
        displayOrder: 1,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: 'tier_professional',
        tier: 'Professional',
        price: '29999',
        billing: 'one-time',
        description: 'Perfect for established businesses needing dynamic features.',
        features: JSON.stringify([
          'Up to 15 Dynamic Pages',
          'Full CMS Integration',
          'Interactive Micro-animations',
          'Speed & Performance Optimization',
          'Payment Gateway Integration',
          '3 Months Priority Support',
        ]),
        highlighted: 'true',
        displayOrder: 2,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: 'tier_enterprise',
        tier: 'Enterprise',
        price: '59999',
        billing: 'one-time',
        description: 'Full-scale digital platforms, custom web apps, and portals.',
        features: JSON.stringify([
          'Unlimited Custom Pages',
          'Enterprise Architecture & Security',
          'Realtime WebSockets & Dashboards',
          'Multi-user Roles & RBAC',
          'Dedicated Project Manager',
          '6 Months VIP Support & SLAs',
        ]),
        highlighted: 'false',
        displayOrder: 3,
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    Portfolio: [
      {
        id: 'port_1',
        title: 'Nexus SaaS Analytics Suite',
        category: 'Web Application',
        description: 'High-throughput analytics dashboard with real-time financial telemetry.',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        liveUrl: 'https://website-builders-wine.vercel.app',
        clientName: 'Nexus Tech',
        displayOrder: 1,
        featured: 'true',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: 'port_2',
        title: 'Lumina Luxury Ecommerce',
        category: 'E-Commerce',
        description: 'Ultra-fast headless commerce platform tailored for premium lifestyle brands.',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        liveUrl: 'https://website-builders-wine.vercel.app',
        clientName: 'Lumina Global',
        displayOrder: 2,
        featured: 'true',
        createdAt: now(),
        updatedAt: now(),
      },
    ],
  };

  try {
    fs.writeFileSync(MOCK_STORAGE_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch {
    // Ignore file write errors in read-only environments
  }
  return initialData;
}

function saveMockData(data: Record<string, Record<string, any>[]>) {
  try {
    fs.writeFileSync(MOCK_STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write to mock sheets cache:', err);
  }
}

// -------------------------------------------------------------
// Core Google Sheets API v4 Operations with In-Memory Caching (<5s SLA)
// -------------------------------------------------------------

const memoryCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL_MS = 15000; // 15 seconds high-performance TTL cache

export function clearSheetCache(sheetName?: SheetName) {
  if (sheetName) {
    memoryCache.delete(sheetName);
  } else {
    memoryCache.clear();
  }
}

/**
 * Fetch all raw rows from a sheet with in-memory caching and 4.5s SLA timeout
 */
export async function getRows<T extends Record<string, any>>(sheetName: SheetName): Promise<T[]> {
  const nowTime = Date.now();
  const cached = memoryCache.get(sheetName);
  if (cached && (nowTime - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data as T[];
  }

  if (!hasGoogleSheetsCredentials()) {
    const mock = loadMockData();
    const result = (mock[sheetName] || []) as T[];
    memoryCache.set(sheetName, { data: result, timestamp: nowTime });
    return result;
  }

  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

    const fetchPromise = sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z`,
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout reading sheet ${sheetName}`)), 4500)
    );

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      memoryCache.set(sheetName, { data: [], timestamp: nowTime });
      return [];
    }

    const headers = rows[0] as string[];
    const dataRows = rows.slice(1);

    const result = dataRows.map((row) => {
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] !== undefined ? row[index] : '';
      });
      return obj as T;
    });

    memoryCache.set(sheetName, { data: result, timestamp: nowTime });
    return result;
  } catch (err) {
    console.error(`Error reading sheet ${sheetName}, falling back to local cache:`, err);
    const mock = loadMockData();
    const fallback = (mock[sheetName] || []) as T[];
    memoryCache.set(sheetName, { data: fallback, timestamp: nowTime });
    return fallback;
  }
}

/**
 * Fetch active rows (excluding empty rows or rows where id is empty)
 */
export async function getActiveRows<T extends Record<string, any>>(sheetName: SheetName): Promise<T[]> {
  const rows = await getRows<T>(sheetName);
  return rows.filter((r) => r.id && String(r.id).trim() !== '');
}

/**
 * Find a single row matching predicate
 */
export async function findRow<T extends Record<string, any>>(
  sheetName: SheetName,
  predicate: (row: T) => boolean
): Promise<T | null> {
  const rows = await getActiveRows<T>(sheetName);
  const found = rows.find(predicate);
  return found || null;
}

/**
 * Find multiple rows matching predicate
 */
export async function findRows<T extends Record<string, any>>(
  sheetName: SheetName,
  predicate: (row: T) => boolean
): Promise<T[]> {
  const rows = await getActiveRows<T>(sheetName);
  return rows.filter(predicate);
}

/**
 * Append a row to a sheet
 */
export async function appendRow<T extends Record<string, any>>(
  sheetName: SheetName,
  rowData: T
): Promise<T> {
  const schemaHeaders = SHEETS[sheetName] as readonly string[];
  const finalRow: Record<string, any> = { ...rowData };

  if (!finalRow.id) {
    finalRow.id = generateId();
  }
  if (!finalRow.createdAt && schemaHeaders.includes('createdAt')) {
    finalRow.createdAt = now();
  }
  if (!finalRow.updatedAt && schemaHeaders.includes('updatedAt')) {
    finalRow.updatedAt = now();
  }

  if (!hasGoogleSheetsCredentials()) {
    const mock = loadMockData();
    if (!mock[sheetName]) mock[sheetName] = [];
    mock[sheetName].push(finalRow);
    saveMockData(mock);
    return finalRow as T;
  }

  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

    const values = [
      schemaHeaders.map((header) => {
        const val = finalRow[header];
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      }),
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    // Also update mock cache as local sync
    const mock = loadMockData();
    if (!mock[sheetName]) mock[sheetName] = [];
    mock[sheetName].push(finalRow);
    saveMockData(mock);

    clearSheetCache(sheetName);
    return finalRow as T;
  } catch (err) {
    console.error(`Error appending to sheet ${sheetName}, writing to local fallback:`, err);
    const mock = loadMockData();
    if (!mock[sheetName]) mock[sheetName] = [];
    mock[sheetName].push(finalRow);
    saveMockData(mock);

    clearSheetCache(sheetName);
    return finalRow as T;
  }
}

/**
 * Update a row by ID in a sheet
 */
export async function updateRow<T extends Record<string, any>>(
  sheetName: SheetName,
  id: string,
  updates: Partial<T>
): Promise<T | null> {
  const schemaHeaders = SHEETS[sheetName] as readonly string[];

  if (!hasGoogleSheetsCredentials()) {
    const mock = loadMockData();
    const list = mock[sheetName] || [];
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const updated = {
      ...list[index],
      ...updates,
      ...(schemaHeaders.includes('updatedAt') ? { updatedAt: now() } : {}),
    };
    list[index] = updated;
    mock[sheetName] = list;
    saveMockData(mock);
    return updated as T;
  }

  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

    // Find row index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return null;

    const headers = rows[0] as string[];
    const idColIndex = headers.indexOf('id');
    if (idColIndex === -1) return null;

    let rowIndex = -1;
    let existingRowObj: Record<string, any> = {};

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idColIndex] === id) {
        rowIndex = i + 1; // 1-based index in sheets
        headers.forEach((h, idx) => {
          existingRowObj[h] = rows[i][idx] !== undefined ? rows[i][idx] : '';
        });
        break;
      }
    }

    if (rowIndex === -1) return null;

    const mergedObj = {
      ...existingRowObj,
      ...updates,
      ...(headers.includes('updatedAt') ? { updatedAt: now() } : {}),
    };

    const updatedValues = [
      headers.map((h) => {
        const val = mergedObj[h];
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      }),
    ];

    const lastCol = colLetter(headers.length - 1);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${rowIndex}:${lastCol}${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: updatedValues },
    });

    // Update local cache
    const mock = loadMockData();
    if (mock[sheetName]) {
      const idx = mock[sheetName].findIndex((r) => r.id === id);
      if (idx !== -1) {
        mock[sheetName][idx] = mergedObj;
        saveMockData(mock);
      }
    }

    clearSheetCache(sheetName);
    return mergedObj as T;
  } catch (err) {
    console.error(`Error updating row in sheet ${sheetName}, using local fallback:`, err);
    const mock = loadMockData();
    const list = mock[sheetName] || [];
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const updated = {
      ...list[index],
      ...updates,
      ...(schemaHeaders.includes('updatedAt') ? { updatedAt: now() } : {}),
    };
    list[index] = updated;
    mock[sheetName] = list;
    saveMockData(mock);
    clearSheetCache(sheetName);
    return updated as T;
  }
}

/**
 * Delete a row by clearing its ID (soft delete in Google Sheets, preserves row ordering)
 */
export async function deleteRow(sheetName: SheetName, id: string): Promise<boolean> {
  if (!hasGoogleSheetsCredentials()) {
    const mock = loadMockData();
    if (!mock[sheetName]) return false;
    const initialLen = mock[sheetName].length;
    mock[sheetName] = mock[sheetName].filter((r) => r.id !== id);
    saveMockData(mock);
    clearSheetCache(sheetName);
    return mock[sheetName].length < initialLen;
  }

  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return false;

    const headers = rows[0] as string[];
    const idColIndex = headers.indexOf('id');
    if (idColIndex === -1) return false;

    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idColIndex] === id) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) return false;

    const lastCol = colLetter(headers.length - 1);
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A${rowIndex}:${lastCol}${rowIndex}`,
    });

    // Update local cache
    const mock = loadMockData();
    if (mock[sheetName]) {
      mock[sheetName] = mock[sheetName].filter((r) => r.id !== id);
      saveMockData(mock);
    }

    clearSheetCache(sheetName);
    return true;
  } catch (err) {
    console.error(`Error deleting row from sheet ${sheetName}, using local fallback:`, err);
    const mock = loadMockData();
    if (!mock[sheetName]) return false;
    const initialLen = mock[sheetName].length;
    mock[sheetName] = mock[sheetName].filter((r) => r.id !== id);
    saveMockData(mock);
    clearSheetCache(sheetName);
    return mock[sheetName].length < initialLen;
  }
}
