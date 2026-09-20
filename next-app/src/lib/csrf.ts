import crypto from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || 'default_csrf_secret_replace_in_production_32chars';

export function generateCsrfToken(sessionId?: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const payload = `${sessionId || 'anon'}:${salt}:${Date.now()}`;
  const signature = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

export function verifyCsrfToken(token: string, sessionId?: string): boolean {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const parts = raw.split(':');
    if (parts.length !== 4) return false;
    const [tokenSessionId, salt, timestampStr, signature] = parts;

    // Check expiry (e.g. 2 hours)
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > 2 * 60 * 60 * 1000) {
      return false;
    }

    if (sessionId && tokenSessionId !== sessionId && tokenSessionId !== 'anon') {
      return false;
    }

    const payload = `${tokenSessionId}:${salt}:${timestampStr}`;
    const expectedSig = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'));
  } catch {
    return false;
  }
}

export function validateOriginAndReferer(req: Request): boolean {
  const host = req.headers.get('host');
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

  if (!host) return false;

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) return false;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) return false;
    } catch {
      return false;
    }
  }

  return true;
}

export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};
