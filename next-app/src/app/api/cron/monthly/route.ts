import { NextRequest, NextResponse } from 'next/server';
import { processMonthlyReportsCron } from '@/lib/automation';
import { appendRow, generateId, now } from '@/lib/sheets';
import { AuditLogRecord } from '@/types/schema';

function verifyCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader === `Bearer ${secret}`) return true;

  const urlSecret = req.nextUrl.searchParams.get('secret');
  if (urlSecret && urlSecret === secret) return true;

  return false;
}

export async function GET(req: NextRequest) {
  return handleMonthlyCron(req);
}

export async function POST(req: NextRequest) {
  return handleMonthlyCron(req);
}

async function handleMonthlyCron(req: NextRequest) {
  const startTime = Date.now();

  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid cron secret.' }, { status: 401 });
  }

  try {
    console.log('[CRON MONTHLY] Starting automated monthly reports generation...');
    const result = await processMonthlyReportsCron();
    const durationMs = Date.now() - startTime;

    try {
      await appendRow<AuditLogRecord>('AuditLogs', {
        id: `AUD-CRON-${Date.now()}-${generateId().slice(0, 4)}`,
        actorId: 'system-cron',
        actorRole: 'system',
        action: 'CRON_MONTHLY_EXECUTED',
        entityType: 'automation',
        entityId: 'monthly_job',
        description: `Monthly reports cron completed in ${durationMs}ms: Processed: ${result.processed}, Sent: ${result.sent}, Skipped: ${result.skipped}, Failed: ${result.failed}`,
        ipHash: req.headers.get('x-forwarded-for')?.slice(0, 40) || 'localhost',
        userAgent: 'cron-runner',
        createdAt: now(),
      });
    } catch (auditErr) {
      console.warn('Failed to append monthly cron to AuditLogs:', auditErr);
    }

    return NextResponse.json({
      success: true,
      job: 'monthly',
      timestamp: now(),
      durationMs,
      result,
    });
  } catch (err: any) {
    console.error('[CRON MONTHLY ERROR]:', err);
    return NextResponse.json({ error: 'Monthly cron job execution failed.', details: err?.message }, { status: 500 });
  }
}
