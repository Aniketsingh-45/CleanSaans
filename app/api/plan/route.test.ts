import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAqiCache } from "@/lib/data/aqi";
import {
  clearPlanCache,
  PlanResponseSchema,
  type PlanAction,
  type PlanInput,
} from "@/lib/data/plan";
import { planRateLimiter } from "@/lib/security/rateLimit";
import { POST } from "./route";

const validProfile: PlanInput = {
  city: "Delhi",
  kids: true,
  elderly: false,
  asthma: true,
  commuteMode: "car",
  commuteKm: 12,
  windows: "open",
  purifier: "no",
  cooking: "lpg",
  chosenStartHour: 7,
  durationHours: 2,
};

function buildOpenMeteoMock(startPm25 = 260, count = 48) {
  const time: string[] = [];
  const pm2_5: number[] = [];
  const baseMs = Date.parse("2026-11-25T06:00:00Z");

  for (let i = 0; i < count; i++) {
    time.push(new Date(baseMs + i * 3600 * 1000).toISOString().slice(0, 16));
    // Midday is cleaner (hours 12..15 drop to ~160)
    const hourOfDay = i % 24;
    const pm = hourOfDay >= 12 && hourOfDay <= 15 ? 160 : startPm25 - (i % 6) * 10;
    pm2_5.push(Math.max(20, pm));
  }

  return { hourly: { time, pm2_5 } };
}

describe("POST /api/plan", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalWaqi = process.env.WAQI_TOKEN;

  beforeEach(() => {
    clearAqiCache();
    clearPlanCache();
    planRateLimiter.reset();
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.WAQI_TOKEN = "test-waqi-token";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
    if (originalWaqi === undefined) {
      delete process.env.WAQI_TOKEN;
    } else {
      process.env.WAQI_TOKEN = originalWaqi;
    }
  });

  it("1) success with mocked Gemini returning valid Hinglish and identical numbers (source: 'ai')", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("air-quality-api.open-meteo.com")) {
        return new Response(JSON.stringify(buildOpenMeteoMock()), { status: 200 });
      }

      if (url.includes("api.waqi.info")) {
        return new Response(JSON.stringify({ status: "ok", data: { aqi: 340 } }), { status: 200 });
      }

      if (url.includes("generativelanguage.googleapis.com")) {
        const body = JSON.parse(String(init?.body)) as {
          contents: Array<{ parts: Array<{ text: string }> }>;
        };
        const inputPrompt = JSON.parse(body.contents[0]?.parts[0]?.text || "{}") as {
          actions: PlanAction[];
        };

        // Gemini echoes the exact actions with Hinglish title and why
        const responseActions = inputPrompt.actions.map((act) => ({
          ...act,
          title: `[AI Hinglish] ${act.title}`,
          why: `[AI Hinglish] ${act.why}`,
        }));

        const geminiPayload = {
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ actions: responseActions }) }],
              },
            },
          ],
        };

        return new Response(JSON.stringify(geminiPayload), { status: 200 });
      }

      return new Response("Not Found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const req = new NextRequest("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validProfile),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const parsed = PlanResponseSchema.parse(json);

    expect(parsed.source).toBe("ai");
    expect(parsed.actions).toHaveLength(5);
    expect(parsed.percentSaved).toBeGreaterThan(0);
    expect(parsed.actions[0]?.title).toContain("[AI Hinglish]");

    // Verify presence of all three required categories
    const categories = parsed.actions.map((a) => a.category);
    expect(categories).toContain("routine");
    expect(categories).toContain("indoor");
    expect(categories).toContain("sustainable");
  });

  it("2) falls back to rule-based templates (source: 'rules') when Gemini returns invalid JSON", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("air-quality-api.open-meteo.com")) {
        return new Response(JSON.stringify(buildOpenMeteoMock()), { status: 200 });
      }
      if (url.includes("api.waqi.info")) {
        return new Response(JSON.stringify({ status: "ok", data: { aqi: 310 } }), { status: 200 });
      }
      if (url.includes("generativelanguage.googleapis.com")) {
        // Return malformed JSON
        const badPayload = {
          candidates: [
            {
              content: {
                parts: [{ text: "This is not valid JSON {{{" }],
              },
            },
          ],
        };
        return new Response(JSON.stringify(badPayload), { status: 200 });
      }
      return new Response("Not Found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const req = new NextRequest("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validProfile),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const parsed = PlanResponseSchema.parse(json);

    // Must gracefully fall back to rule-based template
    expect(parsed.source).toBe("rules");
    expect(parsed.actions).toHaveLength(5);
    expect(parsed.percentSaved).toBeGreaterThan(0);
  });

  it("3) rejects Gemini output that tampers with numbers and falls back to rules", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("air-quality-api.open-meteo.com")) {
        return new Response(JSON.stringify(buildOpenMeteoMock()), { status: 200 });
      }
      if (url.includes("api.waqi.info")) {
        return new Response(JSON.stringify({ status: "ok", data: { aqi: 280 } }), { status: 200 });
      }
      if (url.includes("generativelanguage.googleapis.com")) {
        const body = JSON.parse(String(init?.body)) as {
          contents: Array<{ parts: Array<{ text: string }> }>;
        };
        const inputPrompt = JSON.parse(body.contents[0]?.parts[0]?.text || "{}") as {
          actions: PlanAction[];
        };

        // TAMPER WITH IMPACT NUMBERS!
        const tamperedActions = inputPrompt.actions.map((act) => ({
          ...act,
          impact: {
            ...act.impact,
            cigsSavedLow: 999.9, // Altered number!
          },
        }));

        const payload = {
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ actions: tamperedActions }) }],
              },
            },
          ],
        };
        return new Response(JSON.stringify(payload), { status: 200 });
      }
      return new Response("Not Found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const req = new NextRequest("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validProfile),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const parsed = PlanResponseSchema.parse(json);

    // Tampered numbers must be rejected; must fallback to deterministic rules
    expect(parsed.source).toBe("rules");
    // Verify untampered engine number is returned
    expect(parsed.actions[0]?.impact.cigsSavedLow).not.toBe(999.9);
  });

  it("4) falls back to rules when Gemini call times out or encounters network error", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("air-quality-api.open-meteo.com")) {
        return new Response(JSON.stringify(buildOpenMeteoMock()), { status: 200 });
      }
      if (url.includes("api.waqi.info")) {
        return new Response(JSON.stringify({ status: "ok", data: { aqi: 250 } }), { status: 200 });
      }
      if (url.includes("generativelanguage.googleapis.com")) {
        throw new Error("Timeout: Gemini request timed out");
      }
      return new Response("Not Found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const req = new NextRequest("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validProfile),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const parsed = PlanResponseSchema.parse(json);

    expect(parsed.source).toBe("rules");
    expect(parsed.actions).toHaveLength(5);
  });

  it("5) immediately falls back to rules without network calls when GEMINI_API_KEY is missing", async () => {
    process.env.GEMINI_API_KEY = ""; // Blank key

    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("air-quality-api.open-meteo.com")) {
        return new Response(JSON.stringify(buildOpenMeteoMock()), { status: 200 });
      }
      if (url.includes("api.waqi.info")) {
        return new Response(JSON.stringify({ status: "ok", data: { aqi: 250 } }), { status: 200 });
      }
      if (url.includes("generativelanguage.googleapis.com")) {
        throw new Error("Should not call Gemini when key is missing");
      }
      return new Response("Not Found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const req = new NextRequest("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validProfile),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const parsed = PlanResponseSchema.parse(json);

    expect(parsed.source).toBe("rules");
    expect(parsed.actions).toHaveLength(5);
    // Ensure no Gemini fetch was initiated
    expect(
      fetchMock.mock.calls.some(([arg]) =>
        String(arg).includes("generativelanguage.googleapis.com")
      )
    ).toBe(false);
  });

  it("6) enforces 20 req/min rate limit and returns HTTP 429", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify(buildOpenMeteoMock()), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    process.env.GEMINI_API_KEY = ""; // Speed up test using rules
    const headers = {
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.77",
    };

    // 20 requests allowed
    for (let i = 0; i < 20; i++) {
      const res = await POST(
        new NextRequest("http://localhost:3000/api/plan", {
          method: "POST",
          headers,
          body: JSON.stringify(validProfile),
        })
      );
      expect(res.status).toBe(200);
    }

    // 21st request blocked with 429
    const blockedRes = await POST(
      new NextRequest("http://localhost:3000/api/plan", {
        method: "POST",
        headers,
        body: JSON.stringify(validProfile),
      })
    );
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get("Retry-After")).toBeTruthy();
  });

  it("7) rejects invalid or malformed request payload with safe 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ city: "InvalidCityName", kids: "not-a-bool" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = (await res.json()) as { error: string };
    expect(json.error).toBe("Invalid request payload.");
  });

  it("8) serves cached plan for 10 minutes when profile + rounded hourly data matches", async () => {
    let geminiCalls = 0;
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("air-quality-api.open-meteo.com")) {
        return new Response(JSON.stringify(buildOpenMeteoMock()), { status: 200 });
      }
      if (url.includes("api.waqi.info")) {
        return new Response(JSON.stringify({ status: "ok", data: { aqi: 300 } }), { status: 200 });
      }
      if (url.includes("generativelanguage.googleapis.com")) {
        geminiCalls += 1;
        const body = JSON.parse(String(init?.body)) as {
          contents: Array<{ parts: Array<{ text: string }> }>;
        };
        const inputPrompt = JSON.parse(body.contents[0]?.parts[0]?.text || "{}") as {
          actions: PlanAction[];
        };
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify({ actions: inputPrompt.actions }) }],
                },
              },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response("Not Found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const makeReq = () =>
      new NextRequest("http://localhost:3000/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validProfile),
      });

    // 1st request -> generates and calls Gemini
    const res1 = await POST(makeReq());
    expect(res1.status).toBe(200);
    expect(geminiCalls).toBe(1);

    // 2nd identical request -> served from 10-minute cache without calling Gemini again!
    const res2 = await POST(makeReq());
    expect(res2.status).toBe(200);
    expect(geminiCalls).toBe(1);
  });
});
