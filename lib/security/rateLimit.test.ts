import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { SlidingWindowRateLimiter, getClientIp, rateLimitExceededResponse } from "./rateLimit";

describe("getClientIp", () => {
  it("extracts the first IP from x-forwarded-for header", () => {
    const req = new NextRequest("http://localhost/api/test", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" },
    });
    expect(getClientIp(req)).toBe("203.0.113.195");
  });

  it("extracts IP from x-real-ip when x-forwarded-for is missing", () => {
    const req = new NextRequest("http://localhost/api/test", {
      headers: { "x-real-ip": "198.51.100.1" },
    });
    expect(getClientIp(req)).toBe("198.51.100.1");
  });

  it("falls back to 'unknown' when no IP headers are present", () => {
    const req = new NextRequest("http://localhost/api/test");
    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("SlidingWindowRateLimiter", () => {
  it("allows up to N requests and blocks N+1 with retryAfterSeconds", () => {
    const limiter = new SlidingWindowRateLimiter({ limit: 3, windowMs: 10_000 });
    const ip = "1.2.3.4";
    const now = 1_000_000;

    // First 3 requests allowed
    expect(limiter.check(ip, now)).toMatchObject({ ok: true, remaining: 2 });
    expect(limiter.check(ip, now + 100)).toMatchObject({ ok: true, remaining: 1 });
    expect(limiter.check(ip, now + 200)).toMatchObject({ ok: true, remaining: 0 });

    // 4th request blocked
    const blocked = limiter.check(ip, now + 300);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    // Oldest was at now (1,000,000), expires at now + 10,000 = 1,010,000.
    // At now + 300, remaining ms = 9,700 -> ceil(9700 / 1000) = 10s
    expect(blocked.retryAfterSeconds).toBe(10);
  });

  it("resets capacity after the sliding window elapses", () => {
    const limiter = new SlidingWindowRateLimiter({ limit: 2, windowMs: 5_000 });
    const ip = "5.6.7.8";
    let now = 2_000_000;

    expect(limiter.check(ip, now).ok).toBe(true);
    expect(limiter.check(ip, now + 1000).ok).toBe(true);
    expect(limiter.check(ip, now + 2000).ok).toBe(false);

    // Advance beyond the window (5,000 ms)
    now += 5001;
    const allowedAfterWindow = limiter.check(ip, now);
    expect(allowedAfterWindow.ok).toBe(true);
  });

  it("cleans up expired entries so store memory does not grow unbounded", () => {
    const limiter = new SlidingWindowRateLimiter({
      limit: 5,
      windowMs: 2_000,
      cleanupIntervalMs: 2_000,
    });
    const now = 10_000;

    limiter.check("ip-1", now);
    limiter.check("ip-2", now);
    expect(limiter.getStoreSize()).toBe(2);

    // After window expires, cleanup purges the stale IPs
    limiter.cleanup(now + 2500);
    expect(limiter.getStoreSize()).toBe(0);
  });

  it("manual reset clears the internal store", () => {
    const limiter = new SlidingWindowRateLimiter({ limit: 1, windowMs: 10_000 });
    limiter.check("ip-test");
    expect(limiter.getStoreSize()).toBe(1);
    limiter.reset();
    expect(limiter.getStoreSize()).toBe(0);
  });
});

describe("rateLimitExceededResponse", () => {
  it("returns HTTP 429 with Retry-After header and generic error message", async () => {
    const res = rateLimitExceededResponse(45);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("45");

    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/too many requests/i);
  });
});
