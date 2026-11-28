/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AqiResponse } from "./aqi";
import {
  callGeminiForHinglishText,
  DEFAULT_GEMINI_MODEL,
  GEMINI_TIMEOUT_MS,
  PLAN_CACHE_TTL_MS,
  PlanAction,
  PlanActionSchema,
  PlanInput,
  PlanInputSchema,
  generatePersonalizedPlan,
} from "./plan";

const mockAqiData: AqiResponse = {
  city: "Delhi",
  aqi: 220,
  category: {
    label: "Very Poor",
    hinglish: "Bahut kharab hawa",
  },
  pm25Now: 165,
  hourly: Array.from({ length: 48 }, (_, i) => ({
    time: `2026-11-26T${String(i % 24).padStart(2, "0")}:00:00Z`,
    pm25: 120 + (i % 8) * 10,
  })),
  updatedAt: new Date().toISOString(),
  source: "live",
};

const baseInput: PlanInput = {
  city: "Delhi",
  kids: true,
  elderly: false,
  asthma: true,
  commuteMode: "metro",
  commuteKm: 15,
  windows: "closed",
  purifier: "yes",
  cooking: "lpg",
  chosenStartHour: 13,
  durationHours: 2,
};

describe("plan module", () => {
  const originalApiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-api-key";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalApiKey;
    }
  });

  it("exports constants and validates schemas", () => {
    expect(PLAN_CACHE_TTL_MS).toBe(10 * 60 * 1000);
    expect(GEMINI_TIMEOUT_MS).toBe(10_000);
    expect(DEFAULT_GEMINI_MODEL).toBe("gemini-2.5-flash");

    const validAction = PlanActionSchema.parse({
      id: "action-1",
      time: "12:00 - 15:00",
      category: "routine",
      title: "Khidki kholein",
      why: "Clean air",
      impact: {
        cigsSavedLow: 0.5,
        cigsSavedHigh: 0.8,
        inrSaved: 0,
        co2KgSaved: 0,
        costInr: 0,
      },
    });
    expect(validAction.category).toBe("routine");
  });

  it("PlanInputSchema validates various cooking and boolean inputs", () => {
    const parsed = PlanInputSchema.parse({
      ...baseInput,
      windows: true,
      purifier: false,
      cooking: "wood",
    });
    expect(parsed.cooking).toBe("wood");
  });

  it("generates deterministic plan with rule fallback when Gemini fails or returns invalid text", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const plan = await generatePersonalizedPlan(baseInput, mockAqiData, 100000);
    expect(plan.source).toBe("rules");
    expect(plan.actions).toHaveLength(5);
    expect(plan.baseline.high).toBeGreaterThan(0);
    expect(plan.plan.high).toBeGreaterThan(0);
    expect(plan.percentSaved).toBeGreaterThanOrEqual(0);
    expect(plan.window.startHour).toBeDefined();
  });

  it("polishes plan with Gemini AI when response is valid", async () => {
    const mockActions: PlanAction[] = [
      {
        id: "routine_best_window",
        time: "12:00 - 14:00",
        category: "routine",
        title: "Bahar jayein",
        why: "Saaf hawa",
        impact: { cigsSavedLow: 1, cigsSavedHigh: 2, inrSaved: 0, co2KgSaved: 0, costInr: 0 },
      },
      {
        id: "indoor_ventilation",
        time: "12:00 - 15:00",
        category: "indoor",
        title: "Khidki kholein",
        why: "Fresh air",
        impact: { cigsSavedLow: 0.5, cigsSavedHigh: 0.8, inrSaved: 0, co2KgSaved: 0, costInr: 0 },
      },
      {
        id: "indoor_cooking_exhaust",
        time: "07:00 - 09:00",
        category: "indoor",
        title: "Exhaust chalayein",
        why: "Smoke removal",
        impact: { cigsSavedLow: 0.4, cigsSavedHigh: 0.6, inrSaved: 0, co2KgSaved: 0, costInr: 0 },
      },
      {
        id: "indoor_sensitive_shielding",
        time: "06:00 - 10:00",
        category: "indoor",
        title: "Bache andar rahein",
        why: "Sensitive lungs",
        impact: { cigsSavedLow: 0.8, cigsSavedHigh: 1.2, inrSaved: 0, co2KgSaved: 0, costInr: 0 },
      },
      {
        id: "sustainable_commute_swap",
        time: "08:00 - 09:00",
        category: "sustainable",
        title: "Metro lein",
        why: "Save fuel",
        impact: {
          cigsSavedLow: 1.2,
          cigsSavedHigh: 1.6,
          inrSaved: 50,
          co2KgSaved: 1.5,
          costInr: 25,
        },
      },
    ];

    const polishedCandidate = mockActions.map((act) => ({
      ...act,
      title: act.title + " (polished)",
      why: act.why + " (detailed)",
    }));

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ actions: polishedCandidate }) }],
            },
          },
        ],
      }),
    } as Response);

    const result = await callGeminiForHinglishText(mockActions, { apiKey: "test-key" });
    expect(result.source).toBe("ai");
    expect(result.actions[0]?.title).toContain("(polished)");
  });

  it("retries with gemini-flash-lite-latest when 429 is encountered", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

    const customInput: PlanInput = { ...baseInput, chosenStartHour: 15 };
    const plan = await generatePersonalizedPlan(customInput, mockAqiData, 400000);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1]?.[0]).toContain("gemini-flash-lite-latest");
    expect(plan.source).toBe("rules");
  });

  it("returns cached plan on second call with identical inputs within TTL", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const customInput: PlanInput = { ...baseInput, chosenStartHour: 16 };
    const firstCallTime = 500000;

    const plan1 = await generatePersonalizedPlan(customInput, mockAqiData, firstCallTime);
    expect(plan1).toBeDefined();

    const plan2 = await generatePersonalizedPlan(
      customInput,
      mockAqiData,
      firstCallTime + 5 * 60 * 1000
    );

    expect(plan2).toEqual(plan1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
