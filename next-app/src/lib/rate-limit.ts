import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// In-memory fallback map for environments without live Redis
interface RateLimitRecord {
  count: number;
  resetAt: number;
  lockedUntil?: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

let redisClient: Redis | null = null;
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  !process.env.UPSTASH_REDIS_REST_URL.includes('mock-redis')
) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch {
    redisClient = null;
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number;
}

export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number,
  lockoutSeconds: number = 0
): Promise<RateLimitResult> {
  const now = Date.now();
  const memoryKey = `${key}:${maxAttempts}:${windowSeconds}`;

  const record = memoryStore.get(memoryKey);

  // Check lockout
  if (record && record.lockedUntil && record.lockedUntil > now) {
    const retryAfter = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      success: false,
      limit: maxAttempts,
      remaining: 0,
      reset: Math.ceil(record.lockedUntil / 1000),
      retryAfter,
    };
  }

  // If redis client is configured and working
  if (redisClient) {
    try {
      const ratelimit = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(maxAttempts, `${windowSeconds} s`),
        prefix: 'ratelimit',
      });
      const res = await ratelimit.limit(key);
      if (!res.success) {
        let retryAfter = Math.ceil((res.reset - now) / 1000);
        if (lockoutSeconds > 0) {
          retryAfter = lockoutSeconds;
        }
        return {
          success: false,
          limit: maxAttempts,
          remaining: 0,
          reset: Math.ceil((now + retryAfter * 1000) / 1000),
          retryAfter,
        };
      }
      return {
        success: true,
        limit: maxAttempts,
        remaining: res.remaining,
        reset: Math.ceil(res.reset / 1000),
        retryAfter: 0,
      };
    } catch {
      // Fallback to memory store if Redis request fails
    }
  }

  // In-memory rate limiting logic
  if (!record || record.resetAt <= now) {
    memoryStore.set(memoryKey, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      success: true,
      limit: maxAttempts,
      remaining: maxAttempts - 1,
      reset: Math.ceil((now + windowSeconds * 1000) / 1000),
      retryAfter: 0,
    };
  }

  if (record.count >= maxAttempts) {
    if (lockoutSeconds > 0 && !record.lockedUntil) {
      record.lockedUntil = now + lockoutSeconds * 1000;
    }
    const targetExpiry = record.lockedUntil || record.resetAt;
    const retryAfter = Math.max(1, Math.ceil((targetExpiry - now) / 1000));
    return {
      success: false,
      limit: maxAttempts,
      remaining: 0,
      reset: Math.ceil(targetExpiry / 1000),
      retryAfter,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit: maxAttempts,
    remaining: maxAttempts - record.count,
    reset: Math.ceil(record.resetAt / 1000),
    retryAfter: 0,
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
