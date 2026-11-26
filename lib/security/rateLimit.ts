import { NextResponse } from "next/server";

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
  remaining: number;
  totalLimit: number;
}

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  cleanupIntervalMs?: number;
}

/**
 * Extracts client IP from incoming request headers.
 * Looks for the first entry in x-forwarded-for, falls back to x-real-ip,
 * or returns "unknown".
 * Never logs or exposes raw IP data with sensitive associations.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

/**
 * In-memory sliding-window rate limiter keyed by client identifier (e.g. IP).
 * Automatically purges expired timestamps and clears stale keys periodically
 * so memory does not grow unbounded over time.
 */
export class SlidingWindowRateLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly cleanupIntervalMs: number;
  private lastCleanupTime: number;
  private readonly store = new Map<string, number[]>();

  constructor(options: RateLimiterOptions) {
    this.limit = Math.max(1, Math.floor(options.limit));
    this.windowMs = Math.max(1000, options.windowMs);
    this.cleanupIntervalMs = options.cleanupIntervalMs ?? Math.max(this.windowMs, 30_000);
    this.lastCleanupTime = Date.now();
  }

  /**
   * Checks whether a request with the given key is allowed under the sliding window.
   */
  public check(key: string, nowMs = Date.now()): RateLimitResult {
    this.maybeCleanup(nowMs);

    const windowStart = nowMs - this.windowMs;
    const timestamps = this.store.get(key) ?? [];

    // Filter to retain only timestamps within the sliding window
    const active = timestamps.filter((t) => t > windowStart);

    if (active.length < this.limit) {
      active.push(nowMs);
      this.store.set(key, active);
      return {
        ok: true,
        retryAfterSeconds: 0,
        remaining: this.limit - active.length,
        totalLimit: this.limit,
      };
    }

    // Rate limit exceeded: calculate retry-after based on oldest timestamp in window
    const oldestTimestamp = active[0] ?? windowStart;
    const retryAfterMs = oldestTimestamp + this.windowMs - nowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

    this.store.set(key, active);
    return {
      ok: false,
      retryAfterSeconds,
      remaining: 0,
      totalLimit: this.limit,
    };
  }

  /**
   * Cleans up expired entries across the entire store.
   */
  public cleanup(nowMs = Date.now()): void {
    const windowStart = nowMs - this.windowMs;
    for (const [key, timestamps] of this.store.entries()) {
      const active = timestamps.filter((t) => t > windowStart);
      if (active.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, active);
      }
    }
    this.lastCleanupTime = nowMs;
  }

  private maybeCleanup(nowMs: number): void {
    if (nowMs - this.lastCleanupTime >= this.cleanupIntervalMs) {
      this.cleanup(nowMs);
    }
  }

  /**
   * Clears all stored rate-limit records (useful for test resets).
   */
  public reset(): void {
    this.store.clear();
    this.lastCleanupTime = Date.now();
  }

  public getStoreSize(): number {
    return this.store.size;
  }
}

/**
 * Creates an HTTP 429 Too Many Requests response with standard Retry-After header.
 */
export function rateLimitExceededResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))),
      },
    }
  );
}

// Global rate limiter instances per API endpoint:
// - /api/aqi: 60 requests per minute per IP
// - /api/plan, /api/audit, /api/ask: 20 requests per minute per IP
export const aqiRateLimiter = new SlidingWindowRateLimiter({
  limit: 60,
  windowMs: 60_000,
});

export const planRateLimiter = new SlidingWindowRateLimiter({
  limit: 20,
  windowMs: 60_000,
});

export const auditRateLimiter = new SlidingWindowRateLimiter({
  limit: 20,
  windowMs: 60_000,
});

export const askRateLimiter = new SlidingWindowRateLimiter({
  limit: 20,
  windowMs: 60_000,
});
