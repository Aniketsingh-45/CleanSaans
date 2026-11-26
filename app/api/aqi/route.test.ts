import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AQI_CACHE_TTL_MS, AqiResponseSchema, clearAqiCache } from "@/lib/data/aqi";
import { CITIES, CITY_NAMES } from "@/lib/data/cities";
import { getCpcbCategory, pm25ToCpcbAqi } from "@/lib/data/cpcb";
import { aqiRateLimiter } from "@/lib/security/rateLimit";
import { GET } from "./route";

function buildOpenMeteoMock(startPm25 = 240, count = 48) {
  const time: string[] = [];
  const pm2_5: number[] = [];
  const baseMs = Date.parse("2026-11-25T06:00:00Z");

  for (let i = 0; i < count; i++) {
    time.push(new Date(baseMs + i * 3600 * 1000).toISOString().slice(0, 16));
    pm2_5.push(Math.max(10, startPm25 - (i % 12) * 5));
  }

  return { hourly: { time, pm2_5 } };
}

describe("GET /api/aqi", () => {
  const originalWaqiToken = process.env.WAQI_TOKEN;

  beforeEach(() => {
    clearAqiCache();
    aqiRateLimiter.reset();
    process.env.WAQI_TOKEN = "test-waqi-token";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (originalWaqiToken === undefined) {
      delete process.env.WAQI_TOKEN;
    } else {
      process.env.WAQI_TOKEN = originalWaqiToken;
    }
  });

  it("returns live 48-hour Open-Meteo + WAQI data on success", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("air-quality-api.open-meteo.com")) {
        return new Response(JSON.stringify(buildOpenMeteoMock(240)), { status: 200 });
      }
      if (url.includes("api.waqi.info")) {
        expect(url).toContain("token=test-waqi-token");
        return new Response(JSON.stringify({ status: "ok", data: { aqi: 342 } }), {
          status: 200,
        });
      }
      return new Response("Not Found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const req = new NextRequest("http://localhost:3000/api/aqi?city=Delhi");
    const res = await GET(req);
    const body = AqiResponseSchema.parse(await res.json());

    expect(res.status).toBe(200);
    expect(body.city).toBe("Delhi");
    expect(body.source).toBe("live");
    expect(body.aqi).toBe(342);
    expect(body.category).toEqual({ label: "Very Poor", hinglish: "Bahut kharab hawa" });
    expect(body.pm25Now).toBe(240);
    expect(body.hourly).toHaveLength(48);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=600");
  });

  it("falls back to CPCB PM2.5 AQI and keeps source='live' when WAQI is down but Open-Meteo is up", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("air-quality-api.open-meteo.com")) {
        expect(url).toContain(`latitude=${CITIES.Mumbai.lat}`);
        expect(url).toContain(`longitude=${CITIES.Mumbai.lon}`);
        return new Response(JSON.stringify(buildOpenMeteoMock(88)), { status: 200 });
      }
      if (url.includes("api.waqi.info")) {
        return new Response("Upstream error", { status: 503 });
      }
      return new Response("Not Found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const req = new NextRequest("http://localhost:3000/api/aqi?city=mumbai");
    const res = await GET(req);
    const body = AqiResponseSchema.parse(await res.json());

    expect(res.status).toBe(200);
    expect(body.city).toBe("Mumbai");
    expect(body.source).toBe("live");
    expect(body.pm25Now).toBe(88);
    expect(body.aqi).toBe(pm25ToCpcbAqi(88));
    expect(body.category.label).toBe("Moderate");
    expect(body.hourly).toHaveLength(48);
  });

  it("returns cached-delhi.json with source='cached' when everything is down", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("Network failure");
    });

    vi.stubGlobal("fetch", fetchMock);

    const req = new NextRequest("http://localhost:3000/api/aqi?city=Lucknow");
    const res = await GET(req);
    const body = AqiResponseSchema.parse(await res.json());

    expect(res.status).toBe(200);
    expect(body.source).toBe("cached");
    expect(body.city).toBe("Delhi");
    expect(body.hourly).toHaveLength(48);
    expect(body.category).toEqual({ label: "Very Poor", hinglish: "Bahut kharab hawa" });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rejects non-whitelisted cities with HTTP 400", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const req = new NextRequest("http://localhost:3000/api/aqi?city=London");
    const res = await GET(req);
    const json = (await res.json()) as { error: string };

    expect(res.status).toBe(400);
    expect(json.error).toContain("Invalid city");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("caches live city responses for 10 minutes without re-fetching", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-25T10:00:00Z"));

    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("air-quality-api.open-meteo.com")) {
        return new Response(JSON.stringify(buildOpenMeteoMock(150)), { status: 200 });
      }
      return new Response(JSON.stringify({ status: "ok", data: { aqi: 325 } }), { status: 200 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const first = await GET(new NextRequest("http://localhost:3000/api/aqi?city=Noida"));
    expect(first.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // 5 minutes later -> still within 10-minute TTL
    vi.advanceTimersByTime(5 * 60 * 1000);
    const second = await GET(new NextRequest("http://localhost:3000/api/aqi?city=Noida"));
    expect(second.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Past 10 minutes -> re-fetches
    vi.advanceTimersByTime(AQI_CACHE_TTL_MS);
    const third = await GET(new NextRequest("http://localhost:3000/api/aqi?city=Noida"));
    expect(third.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(4);

    vi.useRealTimers();
  });

  it("enforces sliding-window rate limit (60/min) and returns HTTP 429 with Retry-After", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify(buildOpenMeteoMock(100)), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const clientIp = "192.0.2.10";
    const headers = { "x-forwarded-for": clientIp };

    // Send 60 requests -> all should be allowed
    for (let i = 0; i < 60; i++) {
      const res = await GET(
        new NextRequest("http://localhost:3000/api/aqi?city=Delhi", { headers })
      );
      expect(res.status).toBe(200);
    }

    // 61st request -> rate limited with 429
    const blockedRes = await GET(
      new NextRequest("http://localhost:3000/api/aqi?city=Delhi", { headers })
    );
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get("Retry-After")).toBeTruthy();
    const json = (await blockedRes.json()) as { error: string };
    expect(json.error).toMatch(/too many requests/i);
  });
});

describe("cities and CPCB bands", () => {
  it("whitelists all 8 required Indian cities with coordinates", () => {
    expect(CITY_NAMES).toEqual([
      "Delhi",
      "Noida",
      "Gurugram",
      "Lucknow",
      "Patna",
      "Kolkata",
      "Mumbai",
      "Ranchi",
    ]);
    for (const name of CITY_NAMES) {
      expect(CITIES[name].lat).toBeGreaterThan(15);
      expect(CITIES[name].lon).toBeGreaterThan(70);
    }
  });

  it("maps all 6 CPCB AQI bands with Hinglish labels", () => {
    expect(getCpcbCategory(25).label).toBe("Good");
    expect(getCpcbCategory(75).label).toBe("Satisfactory");
    expect(getCpcbCategory(150).label).toBe("Moderate");
    expect(getCpcbCategory(250).label).toBe("Poor");
    expect(getCpcbCategory(350).label).toBe("Very Poor");
    expect(getCpcbCategory(450).label).toBe("Severe");

    for (const aqi of [25, 75, 150, 250, 350, 450]) {
      expect(getCpcbCategory(aqi).hinglish.length).toBeGreaterThan(0);
    }
  });
});
