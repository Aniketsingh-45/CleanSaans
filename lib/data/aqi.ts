import { z } from "zod";
import cachedDelhiRaw from "./cached-delhi.json";
import { CITIES, CityQuerySchema, type CityConfig, type CityName } from "./cities";
import { AqiCategorySchema, getCpcbCategory, pm25ToCpcbAqi } from "./cpcb";

export const AQI_CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5000;
const TARGET_HOURLY_COUNT = 48;

export { AqiCategorySchema };

export const HourlyPm25Schema = z.object({
  time: z.string().min(1),
  pm25: z.number().finite().nonnegative(),
});

export const AqiResponseSchema = z.object({
  city: CityQuerySchema,
  aqi: z.number().int().nonnegative(),
  category: AqiCategorySchema,
  pm25Now: z.number().finite().nonnegative(),
  hourly: z.array(HourlyPm25Schema).length(TARGET_HOURLY_COUNT),
  updatedAt: z.string().min(1),
  source: z.enum(["live", "cached"]),
});

export type HourlyPm25 = z.infer<typeof HourlyPm25Schema>;
export type AqiResponse = z.infer<typeof AqiResponseSchema>;

const OpenMeteoResponseSchema = z.object({
  hourly: z.object({
    time: z.array(z.string().min(1)).min(1),
    pm2_5: z.array(z.number().finite().nullable()).min(1),
  }),
});

const WaqiResponseSchema = z.object({
  status: z.literal("ok"),
  data: z.object({
    aqi: z.number().finite().nonnegative(),
  }),
});

interface CacheEntry {
  data: AqiResponse;
  expiresAt: number;
}

const aqiCache = new Map<CityName, CacheEntry>();

const round1 = (value: number): number => Math.round(value * 10) / 10;

/**
 * Clears the in-memory 10-minute AQI cache (used in unit tests).
 */
export function clearAqiCache(): void {
  aqiCache.clear();
}

function addOneHourIso(isoTime: string, hoursToAdd: number): string {
  const parsed = Date.parse(isoTime);
  if (Number.isNaN(parsed)) {
    return isoTime;
  }
  return new Date(parsed + hoursToAdd * 3600 * 1000).toISOString().slice(0, 16);
}

function normalizeHourly(
  times: readonly string[],
  values: readonly (number | null)[]
): HourlyPm25[] | null {
  const pairCount = Math.min(times.length, values.length, TARGET_HOURLY_COUNT);
  const firstValid = values.find((val): val is number => val !== null && val >= 0);
  if (firstValid === undefined || pairCount === 0) {
    return null;
  }

  let lastValid = firstValid;
  const hourly: HourlyPm25[] = [];

  for (let i = 0; i < pairCount; i++) {
    const time = times[i];
    const rawValue = values[i];
    if (time === undefined) {
      continue;
    }
    if (rawValue !== null && rawValue !== undefined && rawValue >= 0) {
      lastValid = rawValue;
    }
    hourly.push({ time, pm25: round1(lastValid) });
  }

  if (hourly.length === 0) {
    return null;
  }

  // Pad if upstream returns fewer than 48 hourly entries so consumers always receive 48 slots.
  const lastEntry = hourly[hourly.length - 1];
  let step = 1;
  while (hourly.length < TARGET_HOURLY_COUNT && lastEntry) {
    hourly.push({
      time: addOneHourIso(lastEntry.time, step),
      pm25: lastEntry.pm25,
    });
    step += 1;
  }

  return hourly;
}

async function fetchOpenMeteoHourly(city: CityConfig): Promise<HourlyPm25[] | null> {
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${city.lat}&longitude=${city.lon}` +
    `&hourly=pm2_5&forecast_hours=${TARGET_HOURLY_COUNT}&timezone=Asia%2FKolkata`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    const json: unknown = await response.json();
    const parsed = OpenMeteoResponseSchema.safeParse(json);
    if (!parsed.success) {
      return null;
    }
    return normalizeHourly(parsed.data.hourly.time, parsed.data.hourly.pm2_5);
  } catch {
    return null;
  }
}

async function fetchWaqiAqi(city: CityConfig): Promise<number | null> {
  const token = process.env.WAQI_TOKEN?.trim();
  if (!token) {
    return null;
  }

  const url = `https://api.waqi.info/feed/geo:${city.lat};${city.lon}/?token=${encodeURIComponent(token)}`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    const json: unknown = await response.json();
    const parsed = WaqiResponseSchema.safeParse(json);
    if (!parsed.success) {
      return null;
    }
    return Math.round(parsed.data.data.aqi);
  } catch {
    return null;
  }
}

function getCachedFallback(): AqiResponse {
  return AqiResponseSchema.parse({
    ...cachedDelhiRaw,
    source: "cached",
  });
}

/**
 * Fetches live 48-hour PM2.5 forecast (Open-Meteo) and current AQI (WAQI when available,
 * falling back to CPCB PM2.5 sub-index). Results are cached per city for 10 minutes.
 * On upstream failure, returns the local 48-hour cached Delhi winter sample.
 */
export async function getCityAqi(city: CityName, nowMs: number = Date.now()): Promise<AqiResponse> {
  const cachedEntry = aqiCache.get(city);
  if (cachedEntry && nowMs < cachedEntry.expiresAt) {
    return cachedEntry.data;
  }

  const cityConfig = CITIES[city];
  const [hourly, waqiAqi] = await Promise.all([
    fetchOpenMeteoHourly(cityConfig),
    fetchWaqiAqi(cityConfig),
  ]);

  if (!hourly || hourly.length !== TARGET_HOURLY_COUNT) {
    return getCachedFallback();
  }

  const firstHour = hourly[0];
  if (!firstHour) {
    return getCachedFallback();
  }

  const pm25Now = firstHour.pm25;
  const aqi = waqiAqi ?? pm25ToCpcbAqi(pm25Now);
  const category = getCpcbCategory(aqi);

  const livePayload = AqiResponseSchema.parse({
    city,
    aqi,
    category,
    pm25Now,
    hourly,
    updatedAt: new Date(nowMs).toISOString(),
    source: "live",
  });

  aqiCache.set(city, {
    data: livePayload,
    expiresAt: nowMs + AQI_CACHE_TTL_MS,
  });

  return livePayload;
}
