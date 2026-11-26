import { z } from "zod";

/**
 * Whitelisted Indian cities supported by CleanSaans with geographic coordinates
 * used for Open-Meteo Air Quality and WAQI geo lookups.
 */
export const CITY_NAMES = [
  "Delhi",
  "Noida",
  "Gurugram",
  "Lucknow",
  "Patna",
  "Kolkata",
  "Mumbai",
  "Ranchi",
] as const;

export type CityName = (typeof CITY_NAMES)[number];

export interface CityConfig {
  readonly name: CityName;
  readonly lat: number;
  readonly lon: number;
}

export const CityQuerySchema = z.enum(CITY_NAMES);

export const CITIES: Record<CityName, CityConfig> = {
  Delhi: { name: "Delhi", lat: 28.6139, lon: 77.209 },
  Noida: { name: "Noida", lat: 28.5355, lon: 77.391 },
  Gurugram: { name: "Gurugram", lat: 28.4595, lon: 77.0266 },
  Lucknow: { name: "Lucknow", lat: 26.8467, lon: 80.9462 },
  Patna: { name: "Patna", lat: 25.5941, lon: 85.1376 },
  Kolkata: { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
  Mumbai: { name: "Mumbai", lat: 19.076, lon: 72.8777 },
  Ranchi: { name: "Ranchi", lat: 23.3441, lon: 85.3096 },
};

/**
 * Normalizes a raw `?city=` query string (defaulting null to "Delhi" and matching
 * whitelisted names case-insensitively) before Zod whitelist validation.
 * Empty strings or unknown cities are passed through untouched so Zod rejects them.
 */
export function parseCityQuery(rawCity: string | null): z.ZodSafeParseResult<CityName> {
  if (rawCity === null) {
    return CityQuerySchema.safeParse("Delhi");
  }

  const trimmed = rawCity.trim();
  const matched = CITY_NAMES.find((city) => city.toLowerCase() === trimmed.toLowerCase());
  return CityQuerySchema.safeParse(matched ?? trimmed);
}
