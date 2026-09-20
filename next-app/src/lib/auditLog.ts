import { appendRow, generateId, now } from './sheets';
import { AuditLogEntry } from '@/types/schema';
import { NextRequest } from 'next/server';

export async function auditLog({
  actorEmail,
  actorRole,
  action,
  resourceType,
  resourceId,
  resourceName,
  details = '',
  req,
}: {
  actorEmail: string;
  actorRole: string;
  action: string;
  resourceType: 'project' | 'invoice' | 'ticket' | 'lead' | 'pricing' | 'portfolio' | 'user';
  resourceId: string;
  resourceName: string;
  details?: any;
  req?: NextRequest;
}): Promise<AuditLogEntry> {
  const ipAddress = req
    ? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1'
    : 'system';

  const detailsString = typeof details === 'object' ? JSON.stringify(details) : String(details);

  const entry: AuditLogEntry = {
    id: generateId(),
    timestamp: now(),
    actorEmail,
    actorRole,
    action,
    resourceType,
    resourceId,
    resourceName,
    details: detailsString,
    ipAddress,
  };

  try {
    await appendRow<AuditLogEntry>('AuditLog', entry);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }

  return entry;
}
