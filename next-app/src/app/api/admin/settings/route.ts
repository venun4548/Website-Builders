import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getActiveRows, appendRow, updateRow, generateId, now } from '@/lib/sheets';
import { WebsiteSetting } from '@/types/schema';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const rows = await getActiveRows<WebsiteSetting>('WebsiteSettings');
    const settingsMap: Record<string, string> = {};
    rows.forEach((r) => {
      if (r.key) settingsMap[r.key] = r.value;
    });

    return NextResponse.json({ settings: settingsMap });
  } catch (err: any) {
    console.error('Error fetching settings:', err);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { settings } = await req.json();
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object required' }, { status: 400 });
    }

    const rows = await getActiveRows<WebsiteSetting>('WebsiteSettings');

    for (const [key, value] of Object.entries(settings)) {
      const existing = rows.find((r) => r.key === key);
      if (existing) {
        await updateRow<WebsiteSetting>('WebsiteSettings', existing.id, {
          value: String(value),
          updatedAt: now(),
        });
      } else {
        await appendRow<WebsiteSetting>('WebsiteSettings', {
          id: `SET-${generateId().slice(0, 6)}`,
          key,
          value: String(value),
          updatedAt: now(),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error saving settings:', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
