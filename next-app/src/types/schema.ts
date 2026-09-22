export type UserRole = 'superadmin' | 'admin' | 'staff' | 'client';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  company?: string;
  role: UserRole;
  isEmailVerified: 'true' | 'false';
  onboardingComplete: 'true' | 'false';
  brandName?: string;
  brandTagline?: string;
  primaryColor?: string;
  fontPreference?: string;
  targetAudience?: string;
  assignedStaff?: string; // JSON array of user IDs
  twoFactorEnabled?: 'true' | 'false';
  twoFactorSecret?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStage = 'Discovery' | 'Design' | 'Development' | 'Testing' | 'Review' | 'Launched';
export type ProjectTier = 'Starter' | 'Professional' | 'Enterprise';

export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  name: string;
  tier: ProjectTier;
  stage: ProjectStage;
  progress: number; // 0, 20, 40, 60, 80, 100
  assignedStaff?: string; // JSON array of user IDs
  estimatedLaunch?: string;
  actualLaunch?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StageHistory {
  id: string;
  projectId: string;
  clientName?: string;
  clientEmail?: string;
  stage: ProjectStage;
  changedBy: string; // user email
  notes?: string;
  timestamp: string;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';

export interface Invoice {
  id: string; // INV-2026-XXXX
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  amount: number | string; // subtotal
  gstAmount: number | string; // 18% of amount
  totalAmount: number | string; // amount + gstAmount
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number | string;
  rate: number | string;
  amount: number | string;
}

export type FileCategory = 'Deliverable' | 'Asset';

export interface ProjectFile {
  id: string;
  projectId: string;
  clientName?: string;
  clientEmail?: string;
  uploadedBy: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | string;
  fileType: string;
  category: FileCategory;
  uploadedAt: string;
}

export type TicketPriority = 'Low' | 'Medium' | 'High';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface Ticket {
  id: string; // TKT-XXXX
  clientId: string;
  clientName: string;
  clientEmail: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string; // staff email
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderEmail: string;
  senderRole: UserRole;
  message: string;
  timestamp: string;
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  budget?: string;
  message?: string;
  status: LeadStatus;
  assignedTo?: string; // staff email
  convertedProjectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  authorEmail: string;
  note: string;
  timestamp: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  liveUrl?: string;
  clientName?: string;
  displayOrder: number | string;
  featured: 'true' | 'false';
  createdAt: string;
  updatedAt: string;
}

export interface PricingTier {
  id: string;
  tier: ProjectTier;
  price: number | string;
  billing: 'one-time' | 'monthly';
  description: string;
  features: string; // JSON array of string
  highlighted: 'true' | 'false';
  displayOrder: number | string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'stage_change' | 'invoice' | 'ticket' | 'file' | 'lead';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: 'true' | 'false';
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resourceType: 'project' | 'invoice' | 'ticket' | 'lead' | 'pricing' | 'portfolio' | 'user';
  resourceId: string;
  resourceName: string;
  details: string;
  ipAddress?: string;
}

export interface PasswordReset {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  used: 'true' | 'false';
  createdAt: string;
}

export interface EmailVerification {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  used: 'true' | 'false';
  createdAt: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message?: string;
  submittedAt: string;
  convertedToLead: 'true' | 'false';
}

export interface BrandInfo {
  id: string;
  userId: string;
  clientName?: string;
  clientEmail?: string;
  brandName?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  targetAudience?: string;
  competitors?: string;
  brandValues?: string;
  existingWebsite?: string;
  assetsUrl?: string;
  updatedAt: string;
}

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  role: string;
  email: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device?: string;
  browser?: string;
  createdAt: string;
  lastUsedAt?: string;
  active: 'true' | 'false';
}

export interface MonthlyReport {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  projectId: string;
  projectName: string;
  month: string;
  year: string;
  fileName: string;
  generatedAt: string;
  generatedBy: string;
  sentAt?: string;
  emailStatus: 'Pending' | 'Sent' | 'Failed';
  status: 'Generated' | 'Sent' | 'Failed';
}

export type EmailLogType =
  | 'project_update'
  | 'invoice_reminder'
  | 'payment_confirmation'
  | 'lead_followup'
  | 'deadline_alert'
  | 'monthly_report'
  | 'survey'
  | 'maintenance'
  | 'revision_update'
  | 'system';

export interface EmailLog {
  id: string;
  recipient: string;
  recipientName?: string;
  type: EmailLogType;
  subject: string;
  relatedId?: string;
  sentAt: string;
  status: 'Sent' | 'Failed' | 'Pending';
  error?: string;
  retryCount?: number | string;
}

export interface InvoiceReminderLog {
  id: string;
  invoiceId: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  type: 'before_due' | 'due_today' | 'overdue';
  scheduledDate: string;
  sentAt: string;
  status: 'Sent' | 'Failed' | 'Skipped';
}

export interface LeadFollowUpLog {
  id: string;
  leadId: string;
  recipient: string;
  reminderDate: string;
  lastActivityAt: string;
  sentAt: string;
  status: 'Sent' | 'Failed' | 'Skipped';
}

export interface DeadlineAlertLog {
  id: string;
  projectId: string;
  clientName?: string;
  clientEmail?: string;
  alertType: '7_days_before' | 'overdue';
  scheduledDate: string;
  recipientId: string;
  sentAt: string;
  status: 'Sent' | 'Failed' | 'Skipped';
}

export interface AbandonedContact {
  id: string;
  sessionId: string;
  email: string;
  name?: string;
  startedAt: string;
  lastActivityAt: string;
  abandonedAt?: string;
  followUpSent: 'true' | 'false';
  followUpSentAt?: string;
  status: 'pending' | 'followed_up' | 'converted' | 'opted_out';
}

export type RevisionPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type RevisionStatus = 'Open' | 'In Review' | 'In Progress' | 'Awaiting Client' | 'Resolved' | 'Rejected';

export interface RevisionRequest {
  id: string;
  projectId: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  designId?: string;
  designName?: string;
  description: string;
  priority: RevisionPriority;
  status: RevisionStatus;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  internalRemarks?: string;
}

export interface RevisionAnnotation {
  id: string;
  revisionId: string;
  type: 'point' | 'rect' | 'text';
  x: number | string; // normalized 0-1
  y: number | string; // normalized 0-1
  width?: number | string; // normalized 0-1
  height?: number | string; // normalized 0-1
  points?: string;
  text?: string;
  createdAt: string;
}

export interface SatisfactionSurvey {
  id: string;
  projectId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  token: string;
  sentAt: string;
  openedAt?: string;
  submittedAt?: string;
  status: 'Sent' | 'Opened' | 'Submitted';
  scoreOverall?: number | string; // 1-5
  scoreCommunication?: number | string; // 1-5
  scoreQuality?: number | string; // 1-5
  scoreTimeliness?: number | string; // 1-5
  scoreSupport?: number | string; // 1-5
  recommend?: 'true' | 'false';
  comments?: string;
}

export type MaintenanceCategory =
  | 'Content Update'
  | 'Design Change'
  | 'Bug Fix'
  | 'Technical Support'
  | 'Website Update'
  | 'Other';

export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type MaintenanceStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Quoted'
  | 'Awaiting Approval'
  | 'Approved'
  | 'In Progress'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';

export interface MaintenanceRequest {
  id: string;
  projectId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTo?: string;
  assignedStaffName?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  estimatedCost?: number | string;
  approvedCost?: number | string;
  clientApproval?: 'Pending' | 'Approved' | 'Rejected';
  remarks?: string;
}

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  ipHash?: string;
  userAgent?: string;
  createdAt: string;
}

export interface WebsiteSetting {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

export interface TaskRecord {
  id: string;
  clientName?: string;
  clientEmail?: string;
  projectId: string;
  projectName?: string;
  taskTitle: string;
  description?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  priority?: string;
  status: string;
  dueDate?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
