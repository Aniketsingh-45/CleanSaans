import { z } from "zod";

/**
 * CPCB (Central Pollution Control Board, India) National AQI bands and
 * PM2.5-to-AQI sub-index calculation with simple Hinglish labels.
 */

export const CpcbCategoryLabelSchema = z.enum([
  "Good",
  "Satisfactory",
  "Moderate",
  "Poor",
  "Very Poor",
  "Severe",
]);

export type CpcbCategoryLabel = z.infer<typeof CpcbCategoryLabelSchema>;

export const AqiCategorySchema = z.object({
  label: CpcbCategoryLabelSchema,
  hinglish: z.string().min(1),
});

export type AqiCategory = z.infer<typeof AqiCategorySchema>;

interface CpcbBand {
  readonly maxAqi: number;
  readonly label: CpcbCategoryLabel;
  readonly hinglish: string;
}

const CPCB_BANDS: readonly CpcbBand[] = [
  { maxAqi: 50, label: "Good", hinglish: "Acchi hawa" },
  { maxAqi: 100, label: "Satisfactory", hinglish: "Theek-thaak hawa" },
  { maxAqi: 200, label: "Moderate", hinglish: "Thodi kharab hawa" },
  { maxAqi: 300, label: "Poor", hinglish: "Kharab hawa" },
  { maxAqi: 400, label: "Very Poor", hinglish: "Bahut kharab hawa" },
  { maxAqi: Number.POSITIVE_INFINITY, label: "Severe", hinglish: "Behad khatarnak hawa" },
];

interface Pm25Breakpoint {
  readonly cLow: number;
  readonly cHigh: number;
  readonly iLow: number;
  readonly iHigh: number;
}

// Official CPCB 24-hour PM2.5 breakpoints (ug/m3) mapped to AQI sub-index bands.
const CPCB_PM25_BREAKPOINTS: readonly Pm25Breakpoint[] = [
  { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
  { cLow: 30, cHigh: 60, iLow: 51, iHigh: 100 },
  { cLow: 60, cHigh: 90, iLow: 101, iHigh: 200 },
  { cLow: 90, cHigh: 120, iLow: 201, iHigh: 300 },
  { cLow: 120, cHigh: 250, iLow: 301, iHigh: 400 },
  { cLow: 250, cHigh: 380, iLow: 401, iHigh: 500 },
];

/**
 * Maps a numeric AQI value to its official CPCB category label and Hinglish label.
 */
export function getCpcbCategory(aqi: number): AqiCategory {
  const safeAqi = Number.isFinite(aqi) && aqi >= 0 ? aqi : 0;
  for (const band of CPCB_BANDS) {
    if (safeAqi <= band.maxAqi) {
      return { label: band.label, hinglish: band.hinglish };
    }
  }
  return { label: "Severe", hinglish: "Behad khatarnak hawa" };
}

/**
 * Estimates CPCB PM2.5 AQI sub-index from PM2.5 concentration (ug/m3)
 * when live WAQI AQI is unavailable.
 */
export function pm25ToCpcbAqi(pm25: number): number {
  const concentration = Number.isFinite(pm25) && pm25 > 0 ? pm25 : 0;

  for (const bp of CPCB_PM25_BREAKPOINTS) {
    if (concentration <= bp.cHigh) {
      const subIndex =
        ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (concentration - bp.cLow) + bp.iLow;
      return Math.round(subIndex);
    }
  }

  // Linearly extrapolate above 380 ug/m3 using the top CPCB slope.
  const top = CPCB_PM25_BREAKPOINTS[CPCB_PM25_BREAKPOINTS.length - 1];
  if (!top) {
    return 500;
  }
  const slope = (top.iHigh - top.iLow) / (top.cHigh - top.cLow);
  return Math.round(top.iHigh + slope * (concentration - top.cHigh));
}
