import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@/lib/validation/schemas';
import { signJWT } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { SECURE_COOKIE_OPTIONS, validateOriginAndReferer } from '@/lib/csrf';
import { findRow } from '@/lib/sheets';
import { User } from '@/types/schema';

export async function POST(req: NextRequest) {
  try {
    if (!validateOriginAndReferer(req)) {
      return NextResponse.json({ error: 'Forbidden: Invalid request origin.' }, { status: 403 });
    }

    const ip = getClientIp(req);
    // Rate limit: max 5 per IP per 15 min
    const rateLimit = await checkRateLimit(`login:${ip}`, 5, 15 * 60);
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

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed.', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    const cleanEmail = email.trim().toLowerCase();

    const user = await findRow<User>('Users', (u) => u.email?.toLowerCase() === cleanEmail);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Check email verification status (superadmin / staff / admin might be pre-verified)
    if (user.role === 'client' && user.isEmailVerified !== 'true') {
      return NextResponse.json(
        {
          error: 'Please verify your email first.',
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company,
      onboardingComplete: user.onboardingComplete === 'true',
    }, '24h');

    const response = NextResponse.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        onboardingComplete: user.onboardingComplete === 'true',
      },
    });

    response.cookies.set('session', token, {
      ...SECURE_COOKIE_OPTIONS,
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
