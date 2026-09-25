import { NextResponse } from 'next/server';

// ── Types ────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // ms until next token available
}

// ── Token Bucket Implementation ──────────────────────────────────────────────

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private readonly maxTokens: number;
  private readonly refillRate: number;
  private readonly refillIntervalMs: number;
  private timer: NodeJS.Timeout;

  constructor(maxTokens: number, refillRate: number, refillIntervalMs: number) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.refillIntervalMs = refillIntervalMs;

    // Periodic cleanup of stale buckets (every 5 min, non-blocking)
    this.timer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    // @ts-ignore — unref() keeps timer from blocking process exit in Node
    if (this.timer.unref) this.timer.unref();
  }

  consume(key: string): RateLimitResult {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    const timePassed = now - bucket.lastRefill;
    const intervalsPassed = Math.floor(timePassed / this.refillIntervalMs);

    if (intervalsPassed > 0) {
      bucket.tokens = Math.min(
        this.maxTokens,
        bucket.tokens + intervalsPassed * this.refillRate
      );
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true };
    }

    const retryAfter = this.refillIntervalMs - (timePassed % this.refillIntervalMs);
    return { allowed: false, retryAfter };
  }

  private cleanup() {
    const now = Date.now();
    const staleThreshold = this.refillIntervalMs * 10;
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > staleThreshold) {
        this.buckets.delete(key);
      }
    }
  }
}

// ── Pre-configured Limiters ──────────────────────────────────────────────────

/** 60 req/min — general API endpoints */
export const apiLimiter = new RateLimiter(60, 60, 60_000);

/** 10 req/min — auth endpoints (login, register, magic-link) */
export const authLimiter = new RateLimiter(10, 10, 60_000);

/** 45 req/min — search endpoint */
export const searchLimiter = new RateLimiter(45, 45, 60_000);

/** 5 req/min — crawler trigger endpoints */
export const crawlLimiter = new RateLimiter(5, 5, 60_000);

/** 5 req per 10 min per user — LLM essay review (cost control) */
export const essayLimiter = new RateLimiter(5, 5, 10 * 60_000);

// ── IP Extraction ────────────────────────────────────────────────────────────

/**
 * Extract real client IP from standard proxy/CDN headers.
 * Priority: CF-Connecting-IP > X-Real-IP > X-Forwarded-For > fallback
 */
export function getClientIp(request: Request): string {
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }

  return '127.0.0.1';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Unified rate limit check.
 * @param limiter  Pre-configured RateLimiter instance
 * @param request  Incoming request (IP extracted automatically)
 * @param key      Optional override key (e.g. userId for per-user limiting)
 */
export function enforceRateLimit(
  limiter: RateLimiter,
  request: Request,
  key?: string
): RateLimitResult {
  return limiter.consume(key ?? getClientIp(request));
}

/**
 * Standard 429 Too Many Requests response with Retry-After header.
 */
export function rateLimitResponse(retryAfterMs?: number): NextResponse {
  const retryAfterSec = Math.ceil((retryAfterMs ?? 60_000) / 1000);
  return NextResponse.json(
    {
      success: false,
      error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau giây lát.',
      retryAfter: retryAfterSec,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + retryAfterSec),
      },
    }
  );
}
