import crypto from "node:crypto";
import { z } from "zod";
import { getCityAqi, type AqiResponse, type HourlyPm25 } from "./aqi";
import { CityQuerySchema } from "./cities";
import { AqiCategorySchema } from "./cpcb";
import { cigarettes, compare, switchImpact, type Mode, type Slot } from "../engine/index";
import { bestWindow, type BestWindowResult } from "../engine/window";

export const PLAN_CACHE_TTL_MS = 10 * 60 * 1000;
export const GEMINI_TIMEOUT_MS = 10_000;
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export const PlanInputSchema = z.object({
  city: CityQuerySchema,
  kids: z.boolean(),
  elderly: z.boolean(),
  asthma: z.boolean(),
  commuteMode: z.enum(["car", "bike", "bus", "metro", "walk", "cycle"]),
  commuteKm: z.number().finite().nonnegative(),
  windows: z.union([z.boolean(), z.enum(["open", "closed"])]),
  purifier: z.union([z.boolean(), z.enum(["yes", "no"])]),
  cooking: z.enum(["lpg", "induction", "wood", "electric", "LPG", "Induction", "Wood", "Electric"]),
  chosenStartHour: z.number().int().min(0).max(23),
  durationHours: z.number().finite().positive().max(12),
});

export type PlanInput = z.infer<typeof PlanInputSchema>;

export const ActionImpactSchema = z.object({
  cigsSavedLow: z.number().finite().nonnegative(),
  cigsSavedHigh: z.number().finite().nonnegative(),
  inrSaved: z.number().finite(),
  co2KgSaved: z.number().finite(),
  costInr: z.number().finite().nonnegative(),
});

export type ActionImpact = z.infer<typeof ActionImpactSchema>;

export const PlanActionSchema = z.object({
  id: z.string().min(1),
  time: z.string().min(1),
  category: z.enum(["routine", "indoor", "sustainable"]),
  title: z.string().min(1),
  why: z.string().min(1),
  impact: ActionImpactSchema,
});

export type PlanAction = z.infer<typeof PlanActionSchema>;

export const PlanResponseSchema = z.object({
  baseline: z.object({
    low: z.number().finite().nonnegative(),
    high: z.number().finite().nonnegative(),
  }),
  plan: z.object({
    low: z.number().finite().nonnegative(),
    high: z.number().finite().nonnegative(),
  }),
  percentSaved: z.number().finite().nonnegative(),
  window: z.object({
    startHour: z.number().int().min(0).max(23),
    cost: z.object({ low: z.number(), high: z.number() }),
    baselineCost: z.object({ low: z.number(), high: z.number() }),
    saved: z.object({ low: z.number(), high: z.number() }),
    category: AqiCategorySchema,
    avoidIfPossible: z.boolean(),
    advice: z.string(),
  }),
  actions: z.array(PlanActionSchema).length(5),
  source: z.enum(["ai", "rules"]),
});

export type PlanResponse = z.infer<typeof PlanResponseSchema>;

interface CacheEntry {
  data: PlanResponse;
  expiresAt: number;
}

const planCache = new Map<string, CacheEntry>();

export function clearPlanCache(): void {
  planCache.clear();
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * Builds deterministic baseline and plan Slot[] for 24 hours
 * using live/cached hourly PM2.5.
 */
export function buildDaySlots(
  input: PlanInput,
  hourly: readonly HourlyPm25[]
): {
  baselineSlots: Slot[];
  planSlots: Slot[];
  morningAvgPm25: number;
  afternoonAvgPm25: number;
  commutePm25: number;
} {
  const getPm25At = (hourIndex: number): number => {
    const entry = hourly[hourIndex % hourly.length];
    return entry ? entry.pm25 : 200;
  };

  // Commute 8-9am
  const commutePm25 = getPm25At(8);

  // Morning window hours 9-12 (3 hrs)
  const morningAvgPm25 = round1((getPm25At(9) + getPm25At(10) + getPm25At(11)) / 3);

  // Afternoon window hours 12-15 (3 hrs)
  const afternoonAvgPm25 = round1((getPm25At(12) + getPm25At(13) + getPm25At(14)) / 3);

  // Baseline outdoor activity 15-17 (2 hrs)
  const outdoorAvgPm25 = round1((getPm25At(15) + getPm25At(16)) / 2);

  // Rest of day indoors (18 hrs)
  const restHours = 18;
  const generalIndoorPm25 = round1(
    hourly.slice(0, 24).reduce((sum, h) => sum + h.pm25, 0) / Math.min(24, hourly.length)
  );

  const isWindowsOpen =
    typeof input.windows === "boolean" ? input.windows : input.windows === "open";
  const hasPurifier =
    typeof input.purifier === "boolean" ? input.purifier : input.purifier === "yes";

  // 1. Baseline Day Slots (Sum = 24 hrs):
  // - 1 hr commute (8-9am): outdoor walk
  // - 3 hrs morning windows open (9-12pm): open_window rest
  // - 2 hrs afternoon outdoor (15-17pm): outdoor walk
  // - 18 hrs rest indoors: unsealed / closed without purifier
  const baselineSlots: Slot[] = [
    { hours: 1, place: "outdoor", activity: "walk", pm25: commutePm25 },
    { hours: 3, place: "open_window", activity: "rest", pm25: morningAvgPm25 },
    { hours: 2, place: "outdoor", activity: "walk", pm25: outdoorAvgPm25 },
    {
      hours: restHours,
      place: isWindowsOpen ? "open_window" : "closed",
      activity: "rest",
      pm25: generalIndoorPm25,
    },
  ];

  // 2. Plan Day Slots (Sum = 24 hrs):
  // - 1 hr commute (8-9am): protected with n95 mask
  // - 3 hrs midday ventilation (12-15pm) when ambient smog is lowest; morning closed
  // - 2 hrs outdoor time shifted to cleanest window or protected with n95
  // - 18 hrs indoor: purifier in closed room if available, otherwise closed room
  const planSlots: Slot[] = [
    { hours: 1, place: "n95_outdoor", activity: "walk", pm25: commutePm25 },
    { hours: 3, place: "open_window", activity: "rest", pm25: afternoonAvgPm25 },
    { hours: 2, place: "n95_outdoor", activity: "walk", pm25: afternoonAvgPm25 },
    {
      hours: restHours,
      place: hasPurifier ? "purifier" : "closed",
      activity: "rest",
      pm25: generalIndoorPm25,
    },
  ];

  return {
    baselineSlots,
    planSlots,
    morningAvgPm25,
    afternoonAvgPm25,
    commutePm25,
  };
}

/**
 * Builds the 5 deterministic actions with impact numbers strictly calculated by /lib/engine.
 */
export function buildDeterministicActions(
  input: PlanInput,
  hourly: readonly HourlyPm25[],
  bestWin: BestWindowResult,
  dayData: ReturnType<typeof buildDaySlots>
): PlanAction[] {
  const hasSensitive = input.kids || input.elderly || input.asthma;
  const hasPurifier =
    typeof input.purifier === "boolean" ? input.purifier : input.purifier === "yes";

  // Action 1: Routine — Cleanest window for outdoor activity
  const startH = bestWin.startHour;
  const endH = (startH + Math.ceil(input.durationHours)) % 24;
  const formatTime = (h: number): string => `${String(h).padStart(2, "0")}:00`;
  const routineTime = `${formatTime(startH)} - ${formatTime(endH)}`;

  const action1: PlanAction = {
    id: "routine_best_window",
    time: routineTime,
    category: "routine",
    title: "Bahar ka zaroori kaam cleanest window mein karein",
    why: bestWin.avoidIfPossible
      ? "Hawa kharab hai, sensitive members bahar na jayein; agar jana zaroori ho to N95 pehnein."
      : "Is time slot mein ambient pollution din ke baaki ghanton se kam rehta hai.",
    impact: {
      cigsSavedLow: bestWin.saved.low,
      cigsSavedHigh: bestWin.saved.high,
      inrSaved: 0,
      co2KgSaved: 0,
      costInr: 0,
    },
  };

  // Action 2: Indoor — Midday ventilation hack (12:00 - 15:00)
  const morningVentCigs = cigarettes([
    { hours: 3, place: "open_window", activity: "rest", pm25: dayData.morningAvgPm25 },
  ]);
  const afternoonVentCigs = cigarettes([
    { hours: 3, place: "open_window", activity: "rest", pm25: dayData.afternoonAvgPm25 },
  ]);
  const ventSavedLow = round1(Math.max(0, morningVentCigs.low - afternoonVentCigs.low));
  const ventSavedHigh = round1(Math.max(0, morningVentCigs.high - afternoonVentCigs.high));

  const action2: PlanAction = {
    id: "indoor_ventilation",
    time: "12:00 - 15:00",
    category: "indoor",
    title: "Khidki dopahar 12 se 3 baje ke beech hi kholein",
    why: "Dopahar mein dhoop se smog disperse hota hai; subah aur raat ke peak mein khidki band rakhein.",
    impact: {
      cigsSavedLow: ventSavedLow,
      cigsSavedHigh: ventSavedHigh,
      inrSaved: 0,
      co2KgSaved: 0,
      costInr: 0,
    },
  };

  // Action 3: Indoor — Cooking exhaust & zero incense/waste burning
  // Avoids ~150 ug/m3 indoor accumulation over 2 cooking hours
  const cookingSmokeCigs = cigarettes([{ hours: 2, place: "closed", activity: "rest", pm25: 150 }]);
  const action3: PlanAction = {
    id: "indoor_cooking_exhaust",
    time: "07:00 - 09:00 aur 19:00 - 21:00",
    category: "indoor",
    title: "Cooking exhaust chalayein aur agarbatti ya coil bilkul na jalayein",
    why: "Kitchen exhaust aur bina agarbatti ke ghar ke andar particulate matter jama nahi hota.",
    impact: {
      cigsSavedLow: cookingSmokeCigs.low,
      cigsSavedHigh: cookingSmokeCigs.high,
      inrSaved: 0,
      co2KgSaved: 0,
      costInr: 0,
    },
  };

  // Action 4: Indoor — Sensitive member protection & bedroom filtration
  const peakExposureUnsealed = cigarettes([
    { hours: 6, place: "open_window", activity: "rest", pm25: dayData.morningAvgPm25 },
  ]);
  const peakExposureProtected = cigarettes([
    {
      hours: 6,
      place: hasPurifier ? "purifier" : "closed",
      activity: "rest",
      pm25: dayData.morningAvgPm25,
    },
  ]);
  const sensitiveSavedLow = round1(
    Math.max(0, peakExposureUnsealed.low - peakExposureProtected.low)
  );
  const sensitiveSavedHigh = round1(
    Math.max(0, peakExposureUnsealed.high - peakExposureProtected.high)
  );

  const action4: PlanAction = {
    id: "indoor_sensitive_shielding",
    time: "06:00 - 10:00 aur 19:00 - 22:00",
    category: "indoor",
    title: hasSensitive
      ? "Bacche, buzurg aur asthma wale sadasyon ko peak hours mein andar rakhein"
      : "Smog peak hours mein kamre ke darwaze aur khidkiyan achhi tarah band rakhein",
    why: "Subah aur der sham winter smog zameen ke kareeb baithta hai, is samay exposure sabse tez hota hai.",
    impact: {
      cigsSavedLow: sensitiveSavedLow,
      cigsSavedHigh: sensitiveSavedHigh,
      inrSaved: 0,
      co2KgSaved: 0,
      costInr: 0,
    },
  };

  // Action 5: Sustainable — Commute swap & N95 protection
  const targetMode: Mode =
    input.commuteMode === "car" ? "metro" : input.commuteMode === "bike" ? "bus" : "walk";
  const commuteSavings = switchImpact(input.commuteMode, targetMode, input.commuteKm);

  // Mask impact for 1 hr commute
  const noMaskCigs = cigarettes([
    { hours: 1, place: "outdoor", activity: "walk", pm25: dayData.commutePm25 },
  ]);
  const maskCigs = cigarettes([
    { hours: 1, place: "n95_outdoor", activity: "walk", pm25: dayData.commutePm25 },
  ]);
  const maskSavedLow = round1(Math.max(0, noMaskCigs.low - maskCigs.low));
  const maskSavedHigh = round1(Math.max(0, noMaskCigs.high - maskCigs.high));

  const action5: PlanAction = {
    id: "sustainable_commute_swap",
    time: "08:00 - 09:00",
    category: "sustainable",
    title:
      input.commuteMode === "car" || input.commuteMode === "bike"
        ? `Commute mein ${input.commuteMode === "car" ? "Car" : "Bike"} ki jagah ${targetMode === "metro" ? "Metro" : "Bus"} lein aur N95 pehnein`
        : "Commute ke dauran well-fitted N95 mask zaroor pehnein",
    why:
      input.commuteKm > 0
        ? `Public transit se ~${commuteSavings.co2KgSaved} kg CO2 bachega aur N95 se toxic fine particles filter honge.`
        : "Well-fitted N95 mask sadak ke diesel aur smoke particles se 60-80% tak bachata hai.",
    impact: {
      cigsSavedLow: maskSavedLow,
      cigsSavedHigh: maskSavedHigh,
      inrSaved: commuteSavings.inrSaved,
      co2KgSaved: commuteSavings.co2KgSaved,
      costInr: 25, // Rs 25 indicative cost of reusable N95
    },
  };

  return [action1, action2, action3, action4, action5];
}

/**
 * Validates Gemini's returned action array:
 * 1. Schema check with Zod.
 * 2. Strict equality check that EVERY numerical field equals the deterministic input numbers.
 */
export function validateGeminiActions(
  rawCandidate: unknown,
  expectedActions: readonly PlanAction[]
): { valid: true; actions: PlanAction[] } | { valid: false; reason: string } {
  // Candidate could be { actions: [...] } or direct array [...]
  const candidateArray =
    typeof rawCandidate === "object" && rawCandidate !== null && "actions" in rawCandidate
      ? (rawCandidate as { actions: unknown }).actions
      : rawCandidate;

  const parsed = z.array(PlanActionSchema).length(5).safeParse(candidateArray);
  if (!parsed.success) {
    return { valid: false, reason: "Schema validation failed" };
  }

  const actions = parsed.data;
  for (let i = 0; i < 5; i++) {
    const act = actions[i];
    const exp = expectedActions[i];
    if (!act || !exp) {
      return { valid: false, reason: "Missing action index" };
    }

    if (act.id !== exp.id || act.category !== exp.category) {
      return { valid: false, reason: `Mismatch in action id or category at index ${i}` };
    }

    // STRICT NUMBER CHECK: LLM must not alter any numerical values
    if (
      act.impact.cigsSavedLow !== exp.impact.cigsSavedLow ||
      act.impact.cigsSavedHigh !== exp.impact.cigsSavedHigh ||
      act.impact.inrSaved !== exp.impact.inrSaved ||
      act.impact.co2KgSaved !== exp.impact.co2KgSaved ||
      act.impact.costInr !== exp.impact.costInr
    ) {
      return { valid: false, reason: `Tampered impact numbers detected at action index ${i}` };
    }
  }

  return { valid: true, actions };
}

/**
 * Calls Gemini server-side with strict JSON output, retry on failure,
 * and rule-based fallback if numbers are tampered with or timeout occurs.
 */
export async function callGeminiForHinglishText(
  expectedActions: readonly PlanAction[],
  options?: { apiKey?: string; model?: string; timeoutMs?: number }
): Promise<{ actions: PlanAction[]; source: "ai" | "rules" }> {
  const apiKey = (options?.apiKey ?? process.env.GEMINI_API_KEY)?.trim();
  const model = (options?.model ?? process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL).trim();
  const timeoutMs = options?.timeoutMs ?? GEMINI_TIMEOUT_MS;

  // Missing or blank key immediately falls back to rules without network calls
  if (!apiKey) {
    return { actions: [...expectedActions], source: "rules" };
  }

  const systemInstruction =
    "Write simple Hinglish text for the given 5 actions. For each action write 'title' and 'why' (one short sentence). " +
    "Copy time, category and impact fields exactly from the input. Do NOT change, add or invent any numbers. " +
    "You are not a doctor; if symptoms like chest pain or breathlessness are mentioned, advise seeing a doctor.";

  const userPrompt = JSON.stringify({
    instructions:
      "Return JSON matching the schema with exactly these 5 actions with the numbers unchanged.",
    actions: expectedActions,
  });

  let activeModel = model;

  // Try up to 2 attempts (initial + 1 retry)
  for (let attempt = 1; attempt <= 2; attempt++) {
    const isThinkingModel = activeModel.includes("2.5");
    const generationConfig: Record<string, unknown> = {
      response_mime_type: "application/json",
      temperature: 0.2,
    };
    if (isThinkingModel) {
      generationConfig.thinkingConfig = { thinkingBudget: 0 };
    }

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig,
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(activeModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        if (
          (response.status === 429 || response.status === 404) &&
          activeModel !== "gemini-flash-lite-latest"
        ) {
          activeModel = "gemini-flash-lite-latest";
        }
        continue;
      }

      const json = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        continue;
      }

      let parsedCandidate: unknown;
      try {
        parsedCandidate = JSON.parse(text);
      } catch {
        continue;
      }

      const check = validateGeminiActions(parsedCandidate, expectedActions);
      if (check.valid) {
        return { actions: check.actions, source: "ai" };
      }
    } catch {
      // On network failure or timeout, continue to retry or fallback
      continue;
    }
  }

  // Fallback to deterministic rule-based Hinglish text
  return { actions: [...expectedActions], source: "rules" };
}

/**
 * Computes deterministic plan, consults Gemini for Hinglish polish,
 * and caches results for 10 minutes keyed by hash of profile + rounded hourly PM2.5.
 */
export async function generatePersonalizedPlan(
  input: PlanInput,
  aqiData?: AqiResponse,
  nowMs = Date.now()
): Promise<PlanResponse> {
  const cityAqi = aqiData ?? (await getCityAqi(input.city, nowMs));
  const hourly = cityAqi.hourly;

  // Cache key based on input profile + rounded hourly PM2.5 values
  const cacheKeyObj = {
    city: input.city,
    kids: input.kids,
    elderly: input.elderly,
    asthma: input.asthma,
    commuteMode: input.commuteMode,
    commuteKm: input.commuteKm,
    windows: input.windows,
    purifier: input.purifier,
    cooking: input.cooking,
    chosenStartHour: input.chosenStartHour,
    durationHours: input.durationHours,
    hourlyRounded: hourly.map((h) => Math.round(h.pm25)),
  };

  const cacheKey = crypto.createHash("sha256").update(JSON.stringify(cacheKeyObj)).digest("hex");
  const cached = planCache.get(cacheKey);
  if (cached && nowMs < cached.expiresAt) {
    return cached.data;
  }

  // 1. Build Day Slots
  const dayData = buildDaySlots(input, hourly);

  // 2. Compute Baseline vs Plan using /lib/engine
  const comparison = compare(dayData.baselineSlots, dayData.planSlots);

  // 3. Compute best window using /lib/engine/window
  const hasSensitive = input.kids || input.elderly || input.asthma;
  const bestWin = bestWindow(
    hourly,
    input.durationHours,
    6, // earliest standard active hour (6 AM)
    20, // latest standard active hour (8 PM)
    "walk",
    input.chosenStartHour,
    { hasSensitive }
  );

  // 4. Build 5 deterministic actions with engine impact numbers
  const deterministicActions = buildDeterministicActions(input, hourly, bestWin, dayData);

  // 5. Polish with Gemini (or fallback to rules)
  const geminiResult = await callGeminiForHinglishText(deterministicActions);

  const responsePayload = PlanResponseSchema.parse({
    baseline: comparison.baseline,
    plan: comparison.plan,
    percentSaved: comparison.percentSaved,
    window: {
      startHour: bestWin.startHour,
      cost: bestWin.cost,
      baselineCost: bestWin.baselineCost,
      saved: bestWin.saved,
      category: bestWin.category,
      avoidIfPossible: bestWin.avoidIfPossible,
      advice: bestWin.advice,
    },
    actions: geminiResult.actions,
    source: geminiResult.source,
  });

  planCache.set(cacheKey, {
    data: responsePayload,
    expiresAt: nowMs + PLAN_CACHE_TTL_MS,
  });

  return responsePayload;
}
