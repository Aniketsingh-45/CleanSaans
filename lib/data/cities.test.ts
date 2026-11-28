import { describe, expect, it } from "vitest";
import { CITIES, CITY_NAMES, parseCityQuery } from "./cities";

describe("cities module", () => {
  it("whitelists 8 Indian cities with valid latitude and longitude coordinates", () => {
    expect(CITY_NAMES).toHaveLength(8);
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
      const config = CITIES[name];
      expect(config.name).toBe(name);
      expect(config.lat).toBeGreaterThan(15);
      expect(config.lat).toBeLessThan(35);
      expect(config.lon).toBeGreaterThan(70);
      expect(config.lon).toBeLessThan(95);
    }
  });

  it("parseCityQuery defaults to Delhi when rawCity is null", () => {
    const result = parseCityQuery(null);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("Delhi");
    }
  });

  it("parseCityQuery matches whitelisted cities case-insensitively with trimming", () => {
    const testCases: Array<[string, string]> = [
      ["delhi", "Delhi"],
      ["  NOIDA  ", "Noida"],
      ["gurugram", "Gurugram"],
      ["LUCKNOW", "Lucknow"],
      ["Patna", "Patna"],
      ["kolkata", "Kolkata"],
      ["mumbai", "Mumbai"],
      ["  ranchi ", "Ranchi"],
    ];

    for (const [raw, expected] of testCases) {
      const result = parseCityQuery(raw);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(expected);
      }
    }
  });

  it("parseCityQuery rejects non-whitelisted or empty strings", () => {
    const invalidInputs = ["London", "New York", "Bangalore", "", "   ", "random-city"];
    for (const invalid of invalidInputs) {
      const result = parseCityQuery(invalid);
      expect(result.success).toBe(false);
    }
  });
});
