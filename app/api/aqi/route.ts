import { NextResponse, type NextRequest } from "next/server";
import { getCityAqi } from "@/lib/data/aqi";
import { CITY_NAMES, parseCityQuery } from "@/lib/data/cities";
import { aqiRateLimiter, getClientIp, rateLimitExceededResponse } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/aqi?city=<CityName>
 * Returns 48-hour hourly PM2.5 + current AQI and CPCB category (with Hinglish label).
 * Falls back to a cached 48-hour Delhi winter sample if live upstream APIs fail.
 * Protected by sliding-window rate limiting (60 requests/min per client IP).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const rateLimit = aqiRateLimiter.check(ip);
  if (!rateLimit.ok) {
    return rateLimitExceededResponse(rateLimit.retryAfterSeconds);
  }

  const parsedCity = parseCityQuery(request.nextUrl.searchParams.get("city"));
  if (!parsedCity.success) {
    return NextResponse.json(
      {
        error: `Invalid city parameter. Allowed cities: ${CITY_NAMES.join(", ")}.`,
      },
      { status: 400 }
    );
  }

  const payload = await getCityAqi(parsedCity.data);
  const cacheControl =
    payload.source === "live" ? "public, s-maxage=600, stale-while-revalidate=60" : "no-store";

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": cacheControl,
    },
  });
}
