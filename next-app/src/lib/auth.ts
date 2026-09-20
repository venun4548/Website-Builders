import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/schema';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'super_secure_jwt_secret_key_change_in_production_min32chars_long';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  name?: string;
  company?: string;
  [key: string]: unknown;
}

export async function signJWT(payload: Record<string, unknown>, expiresIn: string = '24h'): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get('session')?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

export async function signAdminPinToken(): Promise<string> {
  return new SignJWT({ purpose: 'admin-gate', verified: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
}

export async function verifyAdminPinToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return Boolean(payload && payload.purpose === 'admin-gate' && payload.verified);
  } catch {
    return false;
  }
}

export type AuthenticatedHandler = (
  req: NextRequest,
  context: { user: JWTPayload; params?: any }
) => Promise<NextResponse>;

export function withRole(roles: UserRole[]) {
  return function (handler: AuthenticatedHandler) {
    return async function (req: NextRequest, context: { params?: any } = {}) {
      try {
        const user = await getSessionUser(req);
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
        }

        if (!roles.includes(user.role)) {
          return NextResponse.json({ error: 'Forbidden: Insufficient permissions.' }, { status: 403 });
        }

        return await handler(req, { ...context, user });
      } catch (err) {
        console.error('withRole error:', err);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
      }
    };
  };
}
