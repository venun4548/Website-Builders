import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyPinSchema } from '@/lib/validation/schemas';
import { signAdminPinToken } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { SECURE_COOKIE_OPTIONS, validateOriginAndReferer } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  try {
    if (!validateOriginAndReferer(req)) {
      return NextResponse.json({ error: 'Forbidden: Invalid request origin.' }, { status: 403 });
    }

    const ip = getClientIp(req);
    // Rate limit: max 5 attempts per IP per 15 min, 30-min lockout after that
    const rateLimit = await checkRateLimit(`pin:${ip}`, 5, 15 * 60, 30 * 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many attempts. Account locked out for 30 minutes.' },
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

    const parseResult = verifyPinSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed.', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const submittedPin = parseResult.data.pin;
    const serverPin = process.env.ADMIN_PORTAL_PIN || '7788';

    // Prevent timing attacks using crypto.timingSafeEqual
    const submittedBuffer = Buffer.from(submittedPin);
    const serverBuffer = Buffer.from(serverPin);

    let isMatch = false;
    if (submittedBuffer.length === serverBuffer.length) {
      isMatch = crypto.timingSafeEqual(submittedBuffer, serverBuffer);
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    const pinToken = await signAdminPinToken();

    const response = NextResponse.json({
      success: true,
      message: 'PIN verified successfully. Redirecting to admin login...',
    });

    response.cookies.set('admin-access-token', pinToken, {
      ...SECURE_COOKIE_OPTIONS,
      maxAge: 15 * 60, // 15-min expiry
    });

    return response;
  } catch (err) {
    console.error('verify-pin error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
