import { describe, expect, it } from "vitest";
import {
  bestWindow,
  categoryFor,
  costOfOuting,
  getKolkataClockHour,
  hourlyCigarettes,
} from "./window";

describe("getKolkataClockHour", () => {
  it("extracts clock hour from local ISO string without timezone indicator", () => {
    expect(getKolkataClockHour("2026-11-25T06:00")).toBe(6);
    expect(getKolkataClockHour("2026-11-25T14:30")).toBe(14);
    expect(getKolkataClockHour("2026-11-25T23:00")).toBe(23);
    expect(getKolkataClockHour("2026-11-25T00:00")).toBe(0);
  });

  it("extracts clock hour converted to Asia/Kolkata from UTC string", () => {
    // 00:30 UTC + 05:30 = 06:00 Kolkata
    expect(getKolkataClockHour("2026-11-25T00:30:00Z")).toBe(6);
    // 18:30 UTC + 05:30 = 00:00 (midnight next day) in Kolkata
    expect(getKolkataClockHour("2026-11-25T18:30:00Z")).toBe(0);
  });

  it("extracts clock hour from string with explicit +05:30 offset", () => {
    expect(getKolkataClockHour("2026-11-25T08:00:00+05:30")).toBe(8);
    expect(getKolkataClockHour("2026-11-25T22:00:00+05:30")).toBe(22);
  });

  it("handles malformed or empty strings safely without throwing", () => {
    expect(getKolkataClockHour("")).toBe(0);
    expect(getKolkataClockHour("invalid-date-string")).toBe(0);
  });
});

describe("hourlyCigarettes", () => {
  it("computes 1-hour cigarette exposure matching engine formula", () => {
    // PM2.5 88 outdoor rest for 1 hour = 88 * 1 * 1 * 1 / 24 / 22 = 88 / 528 = ~0.166 -> 0.2
    const res = hourlyCigarettes(88, "outdoor", "rest");
    expect(res).toEqual({ low: 0.2, high: 0.2 });
  });

  it("scales with place factor and breathing multiplier", () => {
    const outdoorRest = hourlyCigarettes(100, "outdoor", "rest");
    const outdoorWalk = hourlyCigarettes(100, "outdoor", "walk");
    const purifierRest = hourlyCigarettes(100, "purifier", "rest");

    expect(outdoorWalk.low).toBeGreaterThan(outdoorRest.low);
    expect(purifierRest.high).toBeLessThan(outdoorRest.low);
  });
});

describe("categoryFor", () => {
  it("correctly categorizes according to CPCB PM2.5 breakpoints with Hinglish labels", () => {
    expect(categoryFor(15)).toEqual({ label: "Good", hinglish: "Acchi hawa" });
    expect(categoryFor(30)).toEqual({ label: "Good", hinglish: "Acchi hawa" });
    expect(categoryFor(45)).toEqual({ label: "Satisfactory", hinglish: "Theek-thaak hawa" });
    expect(categoryFor(60)).toEqual({ label: "Satisfactory", hinglish: "Theek-thaak hawa" });
    expect(categoryFor(75)).toEqual({ label: "Moderate", hinglish: "Thodi kharab hawa" });
    expect(categoryFor(90)).toEqual({ label: "Moderate", hinglish: "Thodi kharab hawa" });
    expect(categoryFor(100)).toEqual({ label: "Poor", hinglish: "Kharab hawa" });
    expect(categoryFor(120)).toEqual({ label: "Poor", hinglish: "Kharab hawa" });
    expect(categoryFor(200)).toEqual({ label: "Very Poor", hinglish: "Bahut kharab hawa" });
    expect(categoryFor(250)).toEqual({ label: "Very Poor", hinglish: "Bahut kharab hawa" });
    expect(categoryFor(350)).toEqual({ label: "Severe", hinglish: "Behad khatarnak hawa" });
  });
});

describe("costOfOuting - fractional durations and weighting", () => {
  it("correctly weights a 0.5 hour partial outing", () => {
    // 1 hr rest at PM2.5 88 = 0.2 cigs. 0.5 hr rest = 0.083 -> 0.1 cigs
    const halfHour = costOfOuting([88], 0, 0.5, "rest", "outdoor");
    const oneHour = costOfOuting([88], 0, 1.0, "rest", "outdoor");

    expect(halfHour.low).toBe(0.1);
    expect(halfHour.high).toBe(0.1);
    expect(halfHour.low).toBeLessThan(oneHour.low);
  });

  it("weights partial hours proportionally across a multi-hour span (e.g. 1.5 and 2.5 hours)", () => {
    // Hour 0: PM2.5 = 100, Hour 1: PM2.5 = 200
    // Duration 1.5 hr: Hour 0 has weight 1.0, Hour 1 has weight 0.5.
    // Total exposure = 100 * 1.0 + 200 * 0.5 = 200 PM2.5-hours.
    const hourly = [100, 200, 300];
    const cost15 = costOfOuting(hourly, 0, 1.5, "rest", "outdoor");

    // Comparing against 1 hr at PM2.5 = 200 (exposure = 200 PM2.5-hours)
    const costOneHourAt200 = costOfOuting([200], 0, 1.0, "rest", "outdoor");
    expect(cost15).toEqual(costOneHourAt200);

    // Duration 2.5 hr across [100, 200, 300]: 100*1 + 200*1 + 300*0.5 = 450 PM2.5-hours
    const cost25 = costOfOuting(hourly, 0, 2.5, "rest", "outdoor");
    expect(cost25.low).toBeGreaterThan(cost15.low);
  });
});

describe("costOfOuting - clock hour indexing and midnight crossing", () => {
  it("indexes by actual clock hour in Asia/Kolkata when entries contain time", () => {
    // Data starting at 06:00 AM (index 0 is hour 6, index 1 is hour 7)
    const hourly = [
      { time: "2026-11-25T06:00", pm25: 100 },
      { time: "2026-11-25T07:00", pm25: 250 },
      { time: "2026-11-25T08:00", pm25: 300 },
    ];

    // Asking for startHour = 7 should match index 1 (PM2.5 = 250), NOT index 7 (which doesn't exist)
    const res = costOfOuting(hourly, 7, 1, "rest", "outdoor");
    expect(res).toEqual(costOfOuting([{ pm25: 250 }], 0, 1, "rest", "outdoor"));
  });

  it("allows windows that cross midnight when the next day's data exists", () => {
    const hourly = [
      { time: "2026-11-25T22:00", pm25: 200 }, // index 0 (hour 22)
      { time: "2026-11-25T23:00", pm25: 300 }, // index 1 (hour 23)
      { time: "2026-11-26T00:00", pm25: 150 }, // index 2 (hour 0 of next day)
      { time: "2026-11-26T01:00", pm25: 100 }, // index 3 (hour 1 of next day)
    ];

    // Outing starting at 23:00 for 2 hours (crosses midnight into 00:00)
    // PM2.5: 300*1 + 150*1 = 450 PM2.5-hours
    const res = costOfOuting(hourly, 23, 2, "rest", "outdoor");
    const expected = costOfOuting([300, 150], 0, 2, "rest", "outdoor");
    expect(res).toEqual(expected);
  });

  it("safely clamps when the next day's data does not exist", () => {
    const hourly = [
      { time: "2026-11-25T22:00", pm25: 200 },
      { time: "2026-11-25T23:00", pm25: 300 },
      // No 00:00 next day
    ];

    // Starting at 23:00 for 2 hours, but only 1 hour available
    const res = costOfOuting(hourly, 23, 2, "rest", "outdoor");
    // Should safely calculate the 1 available hour (300) without throwing
    const expected = costOfOuting([{ pm25: 300 }], 0, 1, "rest", "outdoor");
    expect(res).toEqual(expected);
  });
});

describe("costOfOuting - invalid input rejection/clamping", () => {
  it("safely returns zero exposure without throwing for NaN, negative, or invalid durations", () => {
    expect(costOfOuting([100], 0, -1)).toEqual({ low: 0, high: 0 });
    expect(costOfOuting([100], 0, 0)).toEqual({ low: 0, high: 0 });
    expect(costOfOuting([100], 0, Number.NaN)).toEqual({ low: 0, high: 0 });
    expect(costOfOuting([], 0, 2)).toEqual({ low: 0, high: 0 });
  });

  it("safely returns zero exposure for negative or invalid startHour", () => {
    expect(costOfOuting([100], -5, 1)).toEqual({ low: 0, high: 0 });
    expect(costOfOuting([100], Number.NaN, 1)).toEqual({ low: 0, high: 0 });
  });
});

describe("bestWindow - user-supplied chosenStartHour baseline and savings", () => {
  it("calculates savings relative to the user-supplied chosenStartHour, never below 0", () => {
    // 24 hours of data where morning 7am is peak smog (PM2.5=300) and noon 12pm is cleanest (PM2.5=60)
    const hourly = [
      300,
      320,
      310,
      300,
      290,
      280, // 0..5
      260,
      300,
      220,
      180,
      140,
      70, // 6..11 (hour 7 = 300)
      60,
      80,
      150,
      200,
      250,
      290, // 12..17 (hour 12 = 60)
      310,
      320,
      330,
      310,
      300,
      290, // 18..23
    ];

    // User's chosen time is 7am (peak smog), search range is 6am to 6pm for 2 hours
    const res = bestWindow(hourly, 2, 6, 18, "walk", 7);

    expect(res.startHour).toBe(11); // cleanest 2 contiguous hours [11, 12]
    // Baseline must be the cost at chosen hour 7
    const expectedBaseline = costOfOuting(hourly, 7, 2, "walk", "outdoor");
    expect(res.baselineCost).toEqual(expectedBaseline);

    // Savings must be positive and equal cost(chosen) - cost(best)
    expect(res.saved.low).toBe(round1(Math.max(0, res.baselineCost.low - res.cost.low)));
    expect(res.saved.high).toBe(round1(Math.max(0, res.baselineCost.high - res.cost.high)));
    expect(res.saved.low).toBeGreaterThan(0);
  });

  it("returns saved = 0 when the user's chosenStartHour is already the cleanest time", () => {
    // All hours have high pollution (300) except hour 12 & 13 which are clean (20)
    const hourly = [
      300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 20, 20, 300, 300, 300, 300, 300,
      300, 300, 300, 300, 300,
    ];

    // Best window is at 12 (20 & 20 = 40 vs 320 at hour 11). User already chooses 12!
    const res = bestWindow(hourly, 2, 6, 18, "walk", 12);

    expect(res.startHour).toBe(12);
    expect(res.cost).toEqual(res.baselineCost);
    expect(res.saved).toEqual({ low: 0, high: 0 });
  });

  it("supports chosenStartHour via BestWindowOptions object", () => {
    const hourly = [200, 200, 200, 200, 200, 200, 350, 300, 250, 200, 150, 80, 70, 80, 150, 200];
    const res = bestWindow(hourly, 1, 6, 14, "walk", { chosenStartHour: 6 });

    expect(res.baselineCost).toEqual(costOfOuting(hourly, 6, 1, "walk", "outdoor"));
    expect(res.saved.low).toBeGreaterThan(0);
  });
});

describe("bestWindow - edge cases, invalid inputs, and ties", () => {
  it("handles duration larger than the search range safely without crashing", () => {
    const hourly = [200, 210, 220, 230, 240];
    // Earliest 1, latest 2 -> range span is 1 hr, but duration is 3 hrs
    const res = bestWindow(hourly, 3, 1, 2, "walk");

    expect(res.startHour).toBe(1);
    expect(res.cost).toEqual(res.baselineCost);
    expect(res.saved).toEqual({ low: 0, high: 0 });
  });

  it("safely handles empty data and invalid/zero durations", () => {
    const emptyRes = bestWindow([], 2, 6, 12, "walk");
    expect(emptyRes.startHour).toBe(6);
    expect(emptyRes.cost).toEqual({ low: 0, high: 0 });
    expect(emptyRes.saved).toEqual({ low: 0, high: 0 });

    const zeroDuration = bestWindow([100, 100], 0, 6, 12, "walk");
    expect(zeroDuration.cost).toEqual({ low: 0, high: 0 });
    expect(zeroDuration.saved).toEqual({ low: 0, high: 0 });

    const nanDuration = bestWindow([100, 100], Number.NaN, 6, 12, "walk");
    expect(nanDuration.cost).toEqual({ low: 0, high: 0 });
  });

  it("ties pick the earlier hour", () => {
    // Hours 8 and 10 have the exact same lowest PM2.5 (50)
    const hourly = [200, 200, 200, 200, 200, 200, 200, 200, 50, 200, 50, 200];
    const res = bestWindow(hourly, 1, 6, 12, "walk");

    // Both hour 8 and hour 10 have lowest mid cost, must pick earlier (hour 8)
    expect(res.startHour).toBe(8);
  });

  it("sensitive members do NOT change the numbers, only the advice threshold", () => {
    const hourly = [
      250,
      250,
      250,
      250,
      250,
      250, // 0..5
      250,
      250,
      200,
      150,
      110,
      110, // 6..11
      120,
      150,
      200,
      250,
      250,
      250, // 12..17
    ];

    const standard = bestWindow(hourly, 2, 6, 14, "walk", { hasSensitive: false });
    const sensitive = bestWindow(hourly, 2, 6, 14, "walk", { hasSensitive: true });

    // NUMBERS MUST BE 100% IDENTICAL
    expect(sensitive.cost).toEqual(standard.cost);
    expect(sensitive.baselineCost).toEqual(standard.baselineCost);
    expect(sensitive.saved).toEqual(standard.saved);
    expect(sensitive.startHour).toBe(standard.startHour);

    // ONLY ADVICE & AVOID FLAG CHANGE
    expect(standard.avoidIfPossible).toBe(false);
    expect(sensitive.avoidIfPossible).toBe(true);
    expect(sensitive.advice).toContain("avoid karein");
  });

  it("handles overnight windows spanning across midnight (e.g. 22:00 to 04:00)", () => {
    const hourly = new Array(24).fill(250);
    // Midnight (01:00) is clean (30)
    hourly[1] = 30;
    hourly[2] = 30;

    const res = bestWindow(hourly, 2, 22, 4, "walk");
    expect(res.startHour).toBe(1);
    expect(res.cost.low).toBeLessThan(res.baselineCost.low);
  });

  it("supports parameter ordering with chosenStartHour as 5th argument", () => {
    const hourly = new Array(24).fill(200);
    // Hour 7 is high (350), Hour 11-12 is low (50)
    hourly[7] = 350;
    hourly[8] = 350;
    hourly[11] = 50;
    hourly[12] = 50;

    const res = bestWindow(hourly, 2, 6, 18, 7, "exercise", { hasSensitive: true });

    expect(res.baselineCost).toEqual(costOfOuting(hourly, 7, 2, "exercise", "outdoor"));
    expect(res.saved.low).toBeGreaterThan(0);
  });
});

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
