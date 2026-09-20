import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { getActiveRows } from '@/lib/sheets';
import { AuditLogEntry } from '@/types/schema';

export const GET = withRole(['admin', 'superadmin'])(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const resourceType = searchParams.get('resourceType');
    const format = searchParams.get('format');

    let logs = await getActiveRows<AuditLogEntry>('AuditLog');

    if (resourceType && resourceType !== 'all') {
      logs = logs.filter((log) => log.resourceType === resourceType);
    }

    // Sort newest first
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Support CSV export
    if (format === 'csv') {
      const headerLine = 'ID,Timestamp,Actor Email,Actor Role,Action,Resource Type,Resource ID,Resource Name,Details,IP Address';
      const rows = logs.map((l) =>
        [
          `"${l.id}"`,
          `"${l.timestamp}"`,
          `"${l.actorEmail}"`,
          `"${l.actorRole}"`,
          `"${l.action}"`,
          `"${l.resourceType}"`,
          `"${l.resourceId}"`,
          `"${(l.resourceName || '').replace(/"/g, '""')}"`,
          `"${(l.details || '').replace(/"/g, '""')}"`,
          `"${l.ipAddress || ''}"`,
        ].join(',')
      );

      const csvContent = [headerLine, ...rows].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit_log_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ logs });
  } catch (err) {
    console.error('GET /api/admin/audit-log error:', err);
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
  }
});
