import { describe, expect, it } from "vitest";
import { getCpcbCategory, pm25ToCpcbAqi } from "./cpcb";

describe("lib/data/cpcb - getCpcbCategory and pm25ToCpcbAqi", () => {
  describe("getCpcbCategory", () => {
    it("classifies all official CPCB bands correctly", () => {
      expect(getCpcbCategory(0)).toEqual({ label: "Good", hinglish: "Acchi hawa" });
      expect(getCpcbCategory(50)).toEqual({ label: "Good", hinglish: "Acchi hawa" });
      expect(getCpcbCategory(51)).toEqual({
        label: "Satisfactory",
        hinglish: "Theek-thaak hawa",
      });
      expect(getCpcbCategory(100)).toEqual({
        label: "Satisfactory",
        hinglish: "Theek-thaak hawa",
      });
      expect(getCpcbCategory(101)).toEqual({ label: "Moderate", hinglish: "Thodi kharab hawa" });
      expect(getCpcbCategory(200)).toEqual({ label: "Moderate", hinglish: "Thodi kharab hawa" });
      expect(getCpcbCategory(201)).toEqual({ label: "Poor", hinglish: "Kharab hawa" });
      expect(getCpcbCategory(300)).toEqual({ label: "Poor", hinglish: "Kharab hawa" });
      expect(getCpcbCategory(301)).toEqual({
        label: "Very Poor",
        hinglish: "Bahut kharab hawa",
      });
      expect(getCpcbCategory(400)).toEqual({
        label: "Very Poor",
        hinglish: "Bahut kharab hawa",
      });
      expect(getCpcbCategory(401)).toEqual({
        label: "Severe",
        hinglish: "Behad khatarnak hawa",
      });
      expect(getCpcbCategory(999)).toEqual({
        label: "Severe",
        hinglish: "Behad khatarnak hawa",
      });
    });

    it("safely handles negative, non-finite, and NaN values", () => {
      expect(getCpcbCategory(-25)).toEqual({ label: "Good", hinglish: "Acchi hawa" });
      expect(getCpcbCategory(Number.NaN)).toEqual({ label: "Good", hinglish: "Acchi hawa" });
    });
  });

  describe("pm25ToCpcbAqi", () => {
    it("converts PM2.5 concentrations to CPCB AQI across breakpoints", () => {
      // 0 -> 0
      expect(pm25ToCpcbAqi(0)).toBe(0);
      // 30 -> 50
      expect(pm25ToCpcbAqi(30)).toBe(50);
      // 60 -> 100
      expect(pm25ToCpcbAqi(60)).toBe(100);
      // 90 -> 200
      expect(pm25ToCpcbAqi(90)).toBe(200);
      // 120 -> 300
      expect(pm25ToCpcbAqi(120)).toBe(300);
      // 250 -> 400
      expect(pm25ToCpcbAqi(250)).toBe(400);
      // 380 -> 500
      expect(pm25ToCpcbAqi(380)).toBe(500);
    });

    it("linearly extrapolates above 380 ug/m3 using the top slope", () => {
      // slope = (500 - 401) / (380 - 250) = 99 / 130 ≈ 0.7615
      // at 510 ug/m3: 500 + 0.7615 * 130 = 599
      const extrapolated = pm25ToCpcbAqi(510);
      expect(extrapolated).toBeGreaterThan(500);
      expect(extrapolated).toBe(599);
    });

    it("safely handles negative, zero, and non-finite inputs", () => {
      expect(pm25ToCpcbAqi(-50)).toBe(0);
      expect(pm25ToCpcbAqi(Number.NaN)).toBe(0);
      expect(pm25ToCpcbAqi(Number.POSITIVE_INFINITY)).toBe(0);
    });
  });
});
