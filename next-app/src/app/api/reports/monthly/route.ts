import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getActiveRows } from '@/lib/sheets';
import { MonthlyReport } from '@/types/schema';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const clientId = searchParams.get('clientId');

    const allReports = await getActiveRows<MonthlyReport>('MonthlyReports');

    let filtered = allReports;
    if (user.role === 'client') {
      filtered = filtered.filter((r) => r.clientId === user.userId);
    } else if (clientId) {
      filtered = filtered.filter((r) => r.clientId === clientId);
    }

    if (projectId) {
      filtered = filtered.filter((r) => r.projectId === projectId);
    }

    // Sort descending by generatedAt
    filtered.sort((a, b) => new Date(b.generatedAt || 0).getTime() - new Date(a.generatedAt || 0).getTime());

    return NextResponse.json({ reports: filtered });
  } catch (err: any) {
    console.error('Error fetching monthly reports:', err);
    return NextResponse.json({ error: 'Failed to fetch reports.' }, { status: 500 });
  }
}
