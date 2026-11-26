import { describe, expect, it } from "vitest";
import { ASSUMPTIONS, cigarettes, compare, switchImpact, type Slot } from "./index";

describe("CleanSaans exposure engine", () => {
  it("1) calculates ~4 cigarettes for PM2.5 88 outdoors 24h resting", () => {
    const result = cigarettes([{ hours: 24, place: "outdoor", activity: "rest", pm25: 88 }]);
    expect(result).toEqual({ low: 4, high: 4 });
  });

  it("2) orders exposure as closed < open_window < outdoor", () => {
    const closed = cigarettes([{ hours: 24, place: "closed", activity: "rest", pm25: 100 }]);
    const openWindow = cigarettes([
      { hours: 24, place: "open_window", activity: "rest", pm25: 100 },
    ]);
    const outdoor = cigarettes([{ hours: 24, place: "outdoor", activity: "rest", pm25: 100 }]);

    expect(closed.low).toBeLessThan(openWindow.low);
    expect(openWindow.low).toBeLessThan(outdoor.low);
    expect(closed.high).toBeLessThan(openWindow.high);
    expect(openWindow.high).toBeLessThan(outdoor.high);
  });

  it("3) estimates purifier exposure lower than closed window", () => {
    const purifier = cigarettes([{ hours: 24, place: "purifier", activity: "rest", pm25: 100 }]);
    const closed = cigarettes([{ hours: 24, place: "closed", activity: "rest", pm25: 100 }]);

    expect(purifier.low).toBeLessThan(closed.low);
    expect(purifier.high).toBeLessThan(closed.high);
  });

  it("4) compare() gives percentSaved > 0 for a better plan and 0 when baseline is 0", () => {
    const baseline: Slot[] = [
      { hours: 2, place: "outdoor", activity: "walk", pm25: 250 },
      { hours: 10, place: "open_window", activity: "rest", pm25: 220 },
      { hours: 12, place: "closed", activity: "rest", pm25: 180 },
    ];
    const plan: Slot[] = [
      { hours: 2, place: "n95_outdoor", activity: "walk", pm25: 250 },
      { hours: 10, place: "closed", activity: "rest", pm25: 220 },
      { hours: 12, place: "purifier", activity: "rest", pm25: 180 },
    ];

    const betterComparison = compare(baseline, plan);
    expect(betterComparison.percentSaved).toBeGreaterThan(0);
    expect(betterComparison.plan.high).toBeLessThan(betterComparison.baseline.high);

    const zeroBaseline = compare(
      [{ hours: 24, place: "outdoor", activity: "rest", pm25: 0 }],
      [{ hours: 24, place: "purifier", activity: "rest", pm25: 0 }]
    );
    expect(zeroBaseline.percentSaved).toBe(0);
  });

  it("5) switchImpact car->metro 10 km is positive, and worse mode returns signed negative values", () => {
    const positive = switchImpact("car", "metro", 10);
    expect(positive.co2KgSaved).toBeGreaterThan(0);
    expect(positive.inrSaved).toBeGreaterThan(0);
    expect(positive).toEqual({ co2KgSaved: 1.4, inrSaved: 60 });

    const worse = switchImpact("metro", "car", 10);
    expect(worse).toEqual({ co2KgSaved: -1.4, inrSaved: -60 });
  });

  it("6) handles edge cases: 0 hours, 0 pm25, and empty slots", () => {
    expect(cigarettes([{ hours: 0, place: "outdoor", activity: "exercise", pm25: 300 }])).toEqual({
      low: 0,
      high: 0,
    });
    expect(cigarettes([{ hours: 24, place: "outdoor", activity: "rest", pm25: 0 }])).toEqual({
      low: 0,
      high: 0,
    });
    expect(cigarettes([])).toEqual({ low: 0, high: 0 });
    expect(compare([], [])).toEqual({
      baseline: { low: 0, high: 0 },
      plan: { low: 0, high: 0 },
      percentSaved: 0,
    });
    expect(switchImpact("car", "metro", 0)).toEqual({ co2KgSaved: 0, inrSaved: 0 });
  });
});

describe("ASSUMPTIONS", () => {
  it("exports typed assumptions with approximation wording and citations", () => {
    const ids = ASSUMPTIONS.map((item) => item.id);
    expect(ids).toEqual([
      "cigarette_equivalence",
      "breathing_multipliers",
      "open_window_factor",
      "closed_window_factor",
      "purifier_factor",
      "n95_factor",
      "co2_per_km",
      "inr_per_km",
    ]);

    for (const entry of ASSUMPTIONS) {
      expect(entry.label.trim().length).toBeGreaterThan(0);
      expect(entry.value.trim().length).toBeGreaterThan(0);
      expect(entry.source.trim().length).toBeGreaterThan(0);
      expect(entry.note.trim().length).toBeGreaterThan(0);
      expect(`${entry.value} ${entry.note}`).toMatch(/approx/i);
    }

    const cig = ASSUMPTIONS.find((a) => a.id === "cigarette_equivalence");
    expect(cig?.source).toMatch(/Berkeley Earth/i);
    expect(cig?.value).toContain("22");

    const co2 = ASSUMPTIONS.find((a) => a.id === "co2_per_km");
    expect(co2?.source).toMatch(/verify against IPCC \/ India GHG Program/i);
  });
});
