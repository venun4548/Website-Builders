import { NextRequest, NextResponse } from 'next/server';
import {
  processInvoiceReminders,
  processLeadFollowups,
  processDeadlineAlerts,
  processAbandonedFollowups,
} from '@/lib/automation';
import { appendRow, generateId, now } from '@/lib/sheets';
import { AuditLogRecord } from '@/types/schema';

function verifyCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev fallback if not set

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader === `Bearer ${secret}`) return true;

  const urlSecret = req.nextUrl.searchParams.get('secret');
  if (urlSecret && urlSecret === secret) return true;

  return false;
}

export async function GET(req: NextRequest) {
  return handleDailyCron(req);
}

export async function POST(req: NextRequest) {
  return handleDailyCron(req);
}

async function handleDailyCron(req: NextRequest) {
  const startTime = Date.now();

  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid cron secret.' }, { status: 401 });
  }

  try {
    console.log('[CRON DAILY] Starting automated tasks...');

    const [invoicesResult, leadsResult, deadlinesResult, abandonedResult] = await Promise.all([
      processInvoiceReminders(),
      processLeadFollowups(),
      processDeadlineAlerts(),
      processAbandonedFollowups(),
    ]);

    const durationMs = Date.now() - startTime;

    // Log to AuditLogs
    try {
      await appendRow<AuditLogRecord>('AuditLogs', {
        id: `AUD-CRON-${Date.now()}-${generateId().slice(0, 4)}`,
        actorId: 'system-cron',
        actorRole: 'system',
        action: 'CRON_DAILY_EXECUTED',
        entityType: 'automation',
        entityId: 'daily_job',
        description: `Daily cron completed in ${durationMs}ms: Invoices sent: ${invoicesResult.sent}, Leads alerted: ${leadsResult.sent}, Deadlines alerted: ${deadlinesResult.sent}, Abandoned followed: ${abandonedResult.sent}`,
        ipHash: req.headers.get('x-forwarded-for')?.slice(0, 40) || 'localhost',
        userAgent: 'cron-runner',
        createdAt: now(),
      });
    } catch (auditErr) {
      console.warn('Failed to append daily cron to AuditLogs:', auditErr);
    }

    return NextResponse.json({
      success: true,
      job: 'daily',
      timestamp: now(),
      durationMs,
      results: {
        invoiceReminders: invoicesResult,
        leadFollowups: leadsResult,
        deadlineAlerts: deadlinesResult,
        abandonedFollowups: abandonedResult,
      },
    });
  } catch (err: any) {
    console.error('[CRON DAILY ERROR]:', err);
    return NextResponse.json({ error: 'Daily cron job execution failed.', details: err?.message }, { status: 500 });
  }
}
