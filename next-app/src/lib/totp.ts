import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

const ENCRYPTION_KEY_RAW =
  process.env.TOTP_ENCRYPTION_KEY || 'wb_totp_enc_secret_key_32bytes_len!!';
// Derive 32-byte key using SHA-256
const ENCRYPTION_KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY_RAW).digest();

/**
 * Encrypt TOTP secret before saving to database
 */
export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt stored TOTP secret
 */
export function decryptSecret(encryptedPayload: string): string | null {
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt TOTP secret:', err);
    return null;
  }
}

/**
 * Generate a new TOTP secret, manual setup key, and QR Code Data URI
 */
export async function generateTotpSetup(email: string): Promise<{
  secret: string;
  manualKey: string;
  qrCodeUrl: string;
}> {
  const secret = generateSecret();
  const otpAuthUrl = generateURI({
    issuer: 'Website Builders',
    label: email,
    secret,
  });
  const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

  return {
    secret,
    manualKey: secret,
    qrCodeUrl,
  };
}

/**
 * Verify a 6-digit TOTP code against a decrypted secret
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.replace(/\s+/g, '');
  const result = verifySync({ token: cleanToken, secret, epochTolerance: 30 });
  return Boolean(result?.valid);
}

// -------------------------------------------------------------
// In-Memory Rate Limiting & Lockout for 2FA Verification
// -------------------------------------------------------------
interface AttemptRecord {
  attempts: number;
  lockedUntil?: number;
}
const rateLimitMap = new Map<string, AttemptRecord>();

export function checkTotpRateLimit(identifier: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (record && record.lockedUntil && record.lockedUntil > now) {
    const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  return { allowed: true };
}

export function recordTotpFailure(identifier: string): { locked: boolean; remainingAttempts: number } {
  const now = Date.now();
  let record = rateLimitMap.get(identifier);

  if (!record || (record.lockedUntil && record.lockedUntil <= now)) {
    record = { attempts: 0 };
  }

  record.attempts += 1;

  if (record.attempts >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
    rateLimitMap.set(identifier, record);
    return { locked: true, remainingAttempts: 0 };
  }

  rateLimitMap.set(identifier, record);
  return { locked: false, remainingAttempts: 5 - record.attempts };
}

export function resetTotpAttempts(identifier: string) {
  rateLimitMap.delete(identifier);
}
