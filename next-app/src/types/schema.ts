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
