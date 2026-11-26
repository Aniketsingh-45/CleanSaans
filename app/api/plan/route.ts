import { NextResponse, type NextRequest } from "next/server";
import { generatePersonalizedPlan, PlanInputSchema } from "@/lib/data/plan";
import { getClientIp, planRateLimiter, rateLimitExceededResponse } from "@/lib/security/rateLimit";
import { parseJson } from "@/lib/security/validate";

export const dynamic = "force-dynamic";

/**
 * POST /api/plan
 * Generates a personalized 5-action daily smog plan for families.
 *
 * Rules:
 * - Rate-limited to 20 requests/minute per client IP.
 * - Body validated with Zod (max 100 KB payload, Content-Type: application/json).
 * - All exposure, cigarette, and monetary numbers come strictly from /lib/engine.
 * - Gemini server-side call is validated; tampered numbers trigger a retry and fallback to rules.
 * - Cached for 10 minutes keyed by profile + rounded hourly PM2.5.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const rateLimit = planRateLimiter.check(ip);
  if (!rateLimit.ok) {
    return rateLimitExceededResponse(rateLimit.retryAfterSeconds);
  }

  const parsed = await parseJson(request, PlanInputSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const plan = await generatePersonalizedPlan(parsed.data);
    return NextResponse.json(plan, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to generate plan. Please try again." },
      { status: 500 }
    );
  }
}
