import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';

export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get('session')?.value;
  const csrfToken = generateCsrfToken(sessionToken);
  return NextResponse.json({ csrfToken });
}
