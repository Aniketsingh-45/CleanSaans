/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAqiCache, getCityAqi, HourlyPm25Schema } from "./aqi";

describe("aqi module", () => {
  const originalToken = process.env.WAQI_TOKEN;

  beforeEach(() => {
    clearAqiCache();
    process.env.WAQI_TOKEN = "test-token";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearAqiCache();
    vi.restoreAllMocks();
    if (originalToken === undefined) {
      delete process.env.WAQI_TOKEN;
    } else {
      process.env.WAQI_TOKEN = originalToken;
    }
  });

  it("validates HourlyPm25Schema", () => {
    const item = HourlyPm25Schema.parse({
      time: "2026-11-26T12:00",
      pm25: 145.5,
    });
    expect(item.pm25).toBe(145.5);
  });

  it("pads hourly forecast if Open-Meteo returns fewer than 48 slots", async () => {
    // Return 24 slots instead of 48
    const time: string[] = [];
    const pm2_5: number[] = [];
    const base = Date.parse("2026-11-26T00:00:00Z");
    for (let i = 0; i < 24; i++) {
      time.push(new Date(base + i * 3600 * 1000).toISOString().slice(0, 16));
      pm2_5.push(100);
    }

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("open-meteo.com")) {
        return {
          ok: true,
          json: async () => ({ hourly: { time, pm2_5 } }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({ status: "ok", data: { aqi: 200 } }),
      } as Response;
    });

    const res = await getCityAqi("Delhi");
    expect(res.hourly).toHaveLength(48);
    expect(res.source).toBe("live");
  });

  it("falls back to CPCB AQI calculation when WAQI_TOKEN is not configured", async () => {
    delete process.env.WAQI_TOKEN;

    const time: string[] = [];
    const pm2_5: number[] = [];
    const base = Date.parse("2026-11-26T00:00:00Z");
    for (let i = 0; i < 48; i++) {
      time.push(new Date(base + i * 3600 * 1000).toISOString().slice(0, 16));
      pm2_5.push(120);
    }

    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({ hourly: { time, pm2_5 } }),
      } as Response;
    });

    const res = await getCityAqi("Mumbai");
    expect(res.source).toBe("live");
    expect(res.aqi).toBeGreaterThan(0);
  });

  it("returns cached Delhi fallback when Open-Meteo returns non-ok or invalid schema", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const res = await getCityAqi("Patna");
    expect(res.source).toBe("cached");
    expect(res.city).toBe("Delhi");
    expect(res.hourly).toHaveLength(48);
  });

  it("returns cached Delhi fallback when Open-Meteo returns empty array", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ hourly: { time: [], pm2_5: [] } }),
    } as Response);

    const res = await getCityAqi("Kolkata");
    expect(res.source).toBe("cached");
  });
});
