interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private maxTokens: number;
  private refillRate: number;
  private refillIntervalMs: number;
  private timer: NodeJS.Timeout;

  constructor(maxTokens: number, refillRate: number, refillIntervalMs: number) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.refillIntervalMs = refillIntervalMs;
    
    this.timer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    // @ts-ignore
    if (this.timer.unref) this.timer.unref();
  }

  consume(key: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    const timePassed = now - bucket.lastRefill;
    const intervalsPassed = Math.floor(timePassed / this.refillIntervalMs);
    
    if (intervalsPassed > 0) {
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + intervalsPassed * this.refillRate);
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
    for (const [key, bucket] of this.buckets.entries()) {
      const timePassed = now - bucket.lastRefill;
      if (timePassed > this.refillIntervalMs * 10) {
        this.buckets.delete(key);
      }
    }
  }
}

export const apiLimiter = new RateLimiter(60, 60, 60 * 1000);
export const authLimiter = new RateLimiter(5, 5, 60 * 1000);
export const searchLimiter = new RateLimiter(30, 30, 60 * 1000);
