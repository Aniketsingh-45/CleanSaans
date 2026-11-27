import { NextResponse } from "next/server";
import { getClientIp, askRateLimiter, rateLimitExceededResponse } from "@/lib/security/rateLimit";
import { parseJson } from "@/lib/security/validate";
import { AskRequestSchema, askCleanSaansWithGemini, getFriendlyFallback } from "@/lib/data/ask";

/**
 * POST /api/ask
 *
 * Answers user questions on air pollution habits and winter smog safety.
 * - Rate-limited to 20 requests/min per IP.
 * - Strict payload validation: max 100KB, question max 500 characters, language enum.
 * - Server-side Gemini call with strict safety instructions:
 *   - Under 120 words in requested language.
 *   - No medical advice/diagnosis; direct symptoms (chest pain, breathlessness) to doctor.
 *   - No invented numbers/percentages.
 *   - Ignores prompt injection attempts.
 * - Strict output validation with friendly fallback on any failure.
 * - Zero-logging policy: Never logs questions or API tokens.
 */
export async function POST(request: Request) {
  // 1. Sliding window IP rate limiter (20 req/min)
  const clientIp = getClientIp(request);
  const rateLimitResult = askRateLimiter.check(clientIp);
  if (!rateLimitResult.ok) {
    return rateLimitExceededResponse(rateLimitResult.retryAfterSeconds);
  }

  // 2. Validate request payload
  const parsed = await parseJson(request, AskRequestSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  // 3. Process question with Gemini or friendly fallback
  try {
    const result = await askCleanSaansWithGemini(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch {
    const fallbackAnswer = getFriendlyFallback(parsed.data.language);
    return NextResponse.json({ answer: fallbackAnswer, source: "fallback" }, { status: 200 });
  }
}
