import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { adminLoginSchema } from '@/lib/validation/schemas';
import { signJWT, verifyAdminPinToken } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { dbService } from '@/lib/db';
import { SECURE_COOKIE_OPTIONS, validateOriginAndReferer } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  try {
    if (!validateOriginAndReferer(req)) {
      return NextResponse.json({ error: 'Forbidden: Invalid request origin.' }, { status: 403 });
    }

    // Ensure user has verified the admin PIN gate first
    const pinToken = req.cookies.get('admin-access-token')?.value;
    const isPinValid = pinToken ? await verifyAdminPinToken(pinToken) : false;
    if (!isPinValid) {
      return NextResponse.json({ error: 'Unauthorized: Admin PIN verification required.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    // Rate limit: max 5 per IP per 15 min
    const rateLimit = await checkRateLimit(`admin-login:${ip}`, 5, 15 * 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
          },
        }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const parseResult = adminLoginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed.', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    const user = dbService.findUserByEmail(email);

    if (!user || !['admin', 'superadmin', 'staff'].includes(user.role)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      sessionVersion: user.session_version,
    }, '8h');

    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });

    response.cookies.set('session', token, {
      ...SECURE_COOKIE_OPTIONS,
      maxAge: 8 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error('admin login error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
