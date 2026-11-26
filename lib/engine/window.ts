/**
 * CleanSaans Outing & Best Window Optimization Engine.
 *
 * Deterministic helper functions to evaluate outdoor exposure by hour and
 * identify the cleanest contiguous time slot for an activity.
 *
 * Important note on CPCB categories:
 * Official Central Pollution Control Board (CPCB) India air quality index bands
 * are defined for 24-hour average PM2.5 concentrations; here they are applied to
 * 1-hour and multi-hour outing averages as a practical real-time health-risk
 * communication approximation.
 *
 * Rules:
 * - All numbers strictly originate from /lib/engine calculations.
 * - Sensitive members (kids, elderly, asthma) NEVER alter numerical exposure;
 *   they only lower the safety advice threshold.
 * - All numbers represent approximate awareness indicators, never medical advice.
 * - Invalid, negative, or NaN inputs are rejected or clamped safely without throwing.
 */

import { cigarettes, type Activity, type Place, type Range, type Slot } from "./index";

export type HourlyItem = number | { pm25: number; time?: string };
export type HourlyData = readonly HourlyItem[];

export type CpcbCategoryLabel =
  "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe";

export interface AqiCategory {
  label: CpcbCategoryLabel;
  hinglish: string;
}

export interface BestWindowOptions {
  hasSensitive?: boolean;
  place?: Place;
  chosenStartHour?: number;
}

export interface BestWindowResult {
  startHour: number;
  cost: Range;
  baselineCost: Range;
  saved: Range;
  category: AqiCategory;
  avoidIfPossible: boolean;
  advice: string;
}

const round1 = (n: number): number => {
  const rounded = Math.round(n * 10) / 10;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const midpoint = (r: Range): number => (r.low + r.high) / 2;

/**
 * Parses an ISO or local timestamp string and extracts the clock hour (0-23)
 * in the Asia/Kolkata timezone (UTC+05:30).
 *
 * Behavior:
 * - Strings with explicit timezone offsets (e.g. "Z", "+05:30") are converted to Asia/Kolkata.
 * - Strings without timezone indicators (e.g. "2026-11-25T06:00") are treated as local Asia/Kolkata time.
 * - Invalid strings safely fallback to 0.
 */
export function getKolkataClockHour(timeStr: string): number {
  if (!timeStr || typeof timeStr !== "string") return 0;

  const trimmed = timeStr.trim();
  // Check for timezone indicator (Z or +/-HH:MM or +/-HHMM)
  const hasTimezone = /[Zz]|[+-]\d{2}(?::?\d{2})?$/.test(trimmed);

  if (!hasTimezone) {
    const match = trimmed.match(/[T\s](\d{1,2}):/);
    if (match && match[1]) {
      const h = parseInt(match[1], 10);
      if (Number.isFinite(h)) {
        return ((h % 24) + 24) % 24;
      }
    }
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    try {
      const d = new Date(parsed);
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hourCycle: "h23",
      });
      const h = parseInt(formatter.format(d), 10);
      if (Number.isFinite(h)) {
        return ((h % 24) + 24) % 24;
      }
    } catch {
      // Ignore and fallback to regex
    }
  }

  const match = trimmed.match(/[T\s](\d{1,2}):/);
  if (match && match[1]) {
    const h = parseInt(match[1], 10);
    if (Number.isFinite(h)) {
      return ((h % 24) + 24) % 24;
    }
  }

  return 0;
}

/**
 * Extracts a non-negative finite PM2.5 concentration from an hourly entry.
 * NaN, negative values, and undefined safely return 0.
 */
export function getPm25Value(item: HourlyItem | undefined): number {
  if (item === undefined || item === null) return 0;
  if (typeof item === "number") {
    return Number.isFinite(item) && item >= 0 ? item : 0;
  }
  if (typeof item === "object" && "pm25" in item) {
    return Number.isFinite(item.pm25) && item.pm25 >= 0 ? item.pm25 : 0;
  }
  return 0;
}

/**
 * Resolves the starting index in `hourly` for a target clock hour (0-23).
 *
 * If items contain a `time` field, searches for the entry matching the clock hour in Asia/Kolkata.
 * If items are raw numbers without `time`, indexes directly by `clockHour` (clamped to array bounds).
 * Returns -1 if out of bounds or no match is found.
 */
export function findStartIndexForClockHour(hourly: HourlyData, clockHour: number): number {
  if (!hourly || hourly.length === 0) return -1;

  const hasTime = hourly.some(
    (item) =>
      typeof item === "object" && item !== null && "time" in item && typeof item.time === "string"
  );

  if (hasTime) {
    return hourly.findIndex(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "time" in item &&
        typeof item.time === "string" &&
        getKolkataClockHour(item.time) === clockHour
    );
  }

  if (clockHour < 0 || clockHour >= hourly.length) {
    return -1;
  }
  return clockHour;
}

/**
 * Calculates approximate cigarette equivalents for a single 1-hour activity.
 * Reuses the core deterministic engine: sum(PM2.5 * placeFactor * breathMultiplier * 1) / 24 / 22.
 */
export function hourlyCigarettes(
  pm25: number,
  place: Place = "outdoor",
  activity: Activity = "rest"
): Range {
  const safePm25 = Number.isFinite(pm25) && pm25 >= 0 ? pm25 : 0;
  return cigarettes([{ hours: 1, place, activity, pm25: safePm25 }]);
}

/**
 * Calculates total approximate cigarette exposure over a contiguous outing starting at `startHour`
 * (clock hour 0-23) for `durationHours` (can be fractional, e.g. 0.5 to 3).
 *
 * Partial hours are weighted proportionally:
 * e.g., duration 1.5 weights the 1st hour by 1.0 and the 2nd hour by 0.5.
 *
 * Windows crossing midnight:
 * If subsequent hours exist (e.g. next day's 00:00, 01:00), they are included;
 * otherwise the calculation safely clamps to the end of available data without throwing.
 */
export function costOfOuting(
  hourly: HourlyData,
  startHour: number,
  durationHours: number,
  activity: Activity = "walk",
  place: Place = "outdoor"
): Range {
  const zeroRange: Range = { low: 0, high: 0 };
  if (!hourly || hourly.length === 0) {
    return zeroRange;
  }

  // Reject NaN or non-positive durations safely
  if (!Number.isFinite(durationHours) || durationHours <= 0) {
    return zeroRange;
  }

  // Reject NaN or negative startHour safely
  if (!Number.isFinite(startHour) || startHour < 0) {
    return zeroRange;
  }

  const clockHour = Math.floor(startHour);
  const startIndex = findStartIndexForClockHour(hourly, clockHour);
  if (startIndex === -1 || startIndex >= hourly.length) {
    return zeroRange;
  }

  let remainingDuration = durationHours;
  let currentIndex = startIndex;
  const slots: Slot[] = [];

  while (remainingDuration > 0 && currentIndex < hourly.length) {
    const hourWeight = Math.min(1, remainingDuration);
    const pm25 = getPm25Value(hourly[currentIndex]);
    slots.push({
      hours: hourWeight,
      place,
      activity,
      pm25,
    });
    remainingDuration -= hourWeight;
    currentIndex += 1;
  }

  return cigarettes(slots);
}

/**
 * Maps PM2.5 concentration (ug/m3) to official CPCB 24-hr breakpoints with simple Hinglish labels.
 *
 * Note: CPCB breakpoints are defined for 24-hr averages and applied here to hourly/window
 * values as an approximation.
 *
 * Breakpoints:
 * - 0 to 30: Good ("Acchi hawa")
 * - 31 to 60: Satisfactory ("Theek-thaak hawa")
 * - 61 to 90: Moderate ("Thodi kharab hawa")
 * - 91 to 120: Poor ("Kharab hawa")
 * - 121 to 250: Very Poor ("Bahut kharab hawa")
 * - > 250: Severe ("Behad khatarnak hawa")
 */
export function categoryFor(pm25: number): AqiCategory {
  const safePm25 = Number.isFinite(pm25) && pm25 >= 0 ? pm25 : 0;
  if (safePm25 <= 30) {
    return { label: "Good", hinglish: "Acchi hawa" };
  }
  if (safePm25 <= 60) {
    return { label: "Satisfactory", hinglish: "Theek-thaak hawa" };
  }
  if (safePm25 <= 90) {
    return { label: "Moderate", hinglish: "Thodi kharab hawa" };
  }
  if (safePm25 <= 120) {
    return { label: "Poor", hinglish: "Kharab hawa" };
  }
  if (safePm25 <= 250) {
    return { label: "Very Poor", hinglish: "Bahut kharab hawa" };
  }
  return { label: "Severe", hinglish: "Behad khatarnak hawa" };
}

/**
 * Finds the cleanest contiguous time window for an activity between `earliestHour` and `latestHour`.
 *
 * Baseline:
 * Savings are calculated against `chosenStartHour` (the user's intended time),
 * NOT earliestHour: saved = max(0, cost(chosen) - cost(best)).
 *
 * Behavior:
 * - Scans contiguous clock hours in [earliestHour, latestHour] and picks the start hour with the lowest midpoint cost.
 * - Ties pick the earlier start hour.
 * - Fractional durations (e.g. 0.5 to 3) are weighted accurately.
 * - Windows that cross midnight are supported when data exists, otherwise safely clamped.
 * - Sensitive members (kids, elderly, asthma) NEVER alter the numbers;
 *   they only trigger the "avoid if possible" advice flag when air is Poor or worse.
 * - Invalid, NaN, or non-positive durations return safe fallback values without throwing.
 */
export function bestWindow(
  hourly: HourlyData,
  durationHours: number,
  earliestHour: number,
  latestHour: number,
  activity?: Activity,
  chosenStartHour?: number,
  options?: BestWindowOptions | boolean
): BestWindowResult;
export function bestWindow(
  hourly: HourlyData,
  durationHours: number,
  earliestHour: number,
  latestHour: number,
  activity?: Activity,
  options?: BestWindowOptions | boolean
): BestWindowResult;
export function bestWindow(
  hourly: HourlyData,
  durationHours: number,
  earliestHour: number,
  latestHour: number,
  chosenStartHour?: number,
  activity?: Activity,
  options?: BestWindowOptions | boolean
): BestWindowResult;
export function bestWindow(
  hourly: HourlyData,
  durationHours: number,
  earliestHour: number,
  latestHour: number,
  arg5?: Activity | number,
  arg6?: Activity | number | BestWindowOptions | boolean,
  arg7?: BestWindowOptions | boolean
): BestWindowResult {
  let activity: Activity = "walk";
  let explicitChosenStartHour: number | undefined;
  let options: BestWindowOptions | boolean | undefined;

  // Ergonomic argument parsing supporting both parameter orders:
  // (hourly, duration, earliest, latest, chosenStartHour, activity, options)
  // (hourly, duration, earliest, latest, activity, chosenStartHour, options)
  // (hourly, duration, earliest, latest, activity, options)
  if (typeof arg5 === "number") {
    explicitChosenStartHour = arg5;
    if (typeof arg6 === "string") {
      activity = arg6;
    }
    if (typeof arg7 === "object" || typeof arg7 === "boolean") {
      options = arg7;
    }
  } else {
    if (typeof arg5 === "string") {
      activity = arg5;
    }
    if (typeof arg6 === "number") {
      explicitChosenStartHour = arg6;
      if (typeof arg7 === "object" || typeof arg7 === "boolean") {
        options = arg7;
      }
    } else if (typeof arg6 === "object" || typeof arg6 === "boolean") {
      options = arg6;
    }
  }

  const hasSensitive = typeof options === "boolean" ? options : (options?.hasSensitive ?? false);
  const place = typeof options === "object" && options.place ? options.place : "outdoor";
  const optionChosen =
    typeof options === "object" && typeof options.chosenStartHour === "number"
      ? options.chosenStartHour
      : undefined;

  const zeroRange: Range = { low: 0, high: 0 };

  // Validate duration
  if (!Number.isFinite(durationHours) || durationHours <= 0) {
    return {
      startHour: Number.isFinite(earliestHour) ? Math.max(0, Math.floor(earliestHour)) : 0,
      cost: zeroRange,
      baselineCost: zeroRange,
      saved: zeroRange,
      category: categoryFor(0),
      avoidIfPossible: false,
      advice: "Duration kam se kam 0.5 ghanta honi chahiye.",
    };
  }

  // Handle empty or missing hourly data
  if (!hourly || hourly.length === 0) {
    const safeStart = Number.isFinite(earliestHour) ? Math.max(0, Math.floor(earliestHour)) : 0;
    return {
      startHour: safeStart,
      cost: zeroRange,
      baselineCost: zeroRange,
      saved: zeroRange,
      category: categoryFor(0),
      avoidIfPossible: false,
      advice: "Koi data uplabdh nahi hai.",
    };
  }

  const safeEarliest = Number.isFinite(earliestHour)
    ? Math.max(0, Math.min(23, Math.floor(earliestHour)))
    : 0;
  const safeLatest = Number.isFinite(latestHour)
    ? Math.max(0, Math.min(23, Math.floor(latestHour)))
    : 23;

  // Resolve user-chosen baseline hour; defaults to safeEarliest if not provided
  const rawChosen = explicitChosenStartHour ?? optionChosen;
  const chosenStartHour =
    rawChosen !== undefined && Number.isFinite(rawChosen)
      ? Math.max(0, Math.min(23, Math.floor(rawChosen)))
      : safeEarliest;

  // Baseline cost is the cost of the outing at the user-chosen time
  const baselineCost = costOfOuting(hourly, chosenStartHour, durationHours, activity, place);

  // Generate candidate start hours in the range [earliestHour, latestHour]
  const candidateStarts: number[] = [];
  if (safeEarliest <= safeLatest) {
    const rangeSpan = safeLatest - safeEarliest;
    if (durationHours > rangeSpan) {
      // Duration exceeds range; evaluate safely at earliestHour
      candidateStarts.push(safeEarliest);
    } else {
      const maxStart = Math.floor(safeLatest - durationHours);
      for (let h = safeEarliest; h <= maxStart; h++) {
        candidateStarts.push(h);
      }
      if (candidateStarts.length === 0) {
        candidateStarts.push(safeEarliest);
      }
    }
  } else {
    // Overnight window (e.g. 22:00 to 04:00)
    const rangeSpan = 24 - safeEarliest + safeLatest;
    if (durationHours > rangeSpan) {
      candidateStarts.push(safeEarliest);
    } else {
      let h = safeEarliest;
      let count = 0;
      const maxSteps = Math.floor(rangeSpan - durationHours) + 1;
      while (count < maxSteps) {
        candidateStarts.push(h);
        h = (h + 1) % 24;
        count += 1;
      }
    }
  }

  let bestStart = candidateStarts[0] ?? safeEarliest;
  let bestCost = costOfOuting(hourly, bestStart, durationHours, activity, place);
  let bestMid = midpoint(bestCost);

  // Scan candidates. Strict `<` guarantees ties pick the earlier hour.
  for (let i = 1; i < candidateStarts.length; i++) {
    const candidateStart = candidateStarts[i];
    if (candidateStart === undefined) continue;
    const candidateCost = costOfOuting(hourly, candidateStart, durationHours, activity, place);
    const candidateMid = midpoint(candidateCost);

    if (candidateMid < bestMid) {
      bestMid = candidateMid;
      bestCost = candidateCost;
      bestStart = candidateStart;
    }
  }

  // Savings: cost(chosen) - cost(best), never below 0
  const saved: Range = {
    low: round1(Math.max(0, baselineCost.low - bestCost.low)),
    high: round1(Math.max(0, baselineCost.high - bestCost.high)),
  };

  // Determine average PM2.5 in the chosen window for CPCB categorization
  const bestStartIndex = findStartIndexForClockHour(hourly, bestStart);
  let pm25Sum = 0;
  let weightedDuration = 0;

  if (bestStartIndex !== -1) {
    let rem = durationHours;
    let idx = bestStartIndex;
    while (rem > 0 && idx < hourly.length) {
      const w = Math.min(1, rem);
      pm25Sum += getPm25Value(hourly[idx]) * w;
      weightedDuration += w;
      rem -= w;
      idx += 1;
    }
  }

  const avgPm25 = weightedDuration > 0 ? pm25Sum / weightedDuration : 0;
  const category = categoryFor(avgPm25);

  const isPoorOrWorse =
    category.label === "Poor" || category.label === "Very Poor" || category.label === "Severe";

  // Sensitive members trigger "avoid if possible" when air is Poor or worse
  const avoidIfPossible = hasSensitive && isPoorOrWorse;

  let advice: string;
  if (avoidIfPossible) {
    advice =
      "Buzurg, bacche ya asthma wale parivar ke sadasyon ke liye hawa kharab hai, ho sake to bahar jana avoid karein.";
  } else if (isPoorOrWorse) {
    advice = "Hawa kharab hai, bahar nikalte waqt well-fitted N95 mask zaroor pehnein.";
  } else {
    advice = "Hawa behtar hai, ye samay bahar ke kaam ke liye sabse anukool hai.";
  }

  return {
    startHour: bestStart,
    cost: bestCost,
    baselineCost,
    saved,
    category,
    avoidIfPossible,
    advice,
  };
}
