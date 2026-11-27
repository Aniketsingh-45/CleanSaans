import { NextResponse } from "next/server";
import { auditImageWithGemini } from "@/lib/data/audit";
import { ALLOWED_IMAGE_MIMES, MAX_IMAGE_BYTES, verifyImageMagicBytes } from "@/lib/security/image";
import { auditRateLimiter, getClientIp, rateLimitExceededResponse } from "@/lib/security/rateLimit";

/**
 * POST /api/audit
 * Audits an uploaded household photo for air pollution leaks, open burning, and indoor emission sources.
 *
 * Security & Integrity:
 * - Rate limited: 20 req/min per client IP with Retry-After header.
 * - Requires multipart/form-data with field 'image'.
 * - Strict 4MB size ceiling.
 * - Deep validation via magic byte signatures (JPEG, PNG, WebP).
 * - Server-side Gemini Vision with automatic 1-retry fallback to clear error (no hallucinated data).
 * - Zero storage & zero logging of images, tokens, or coordinates.
 */
export async function POST(request: Request): Promise<NextResponse> {
  // 1. Rate Limiting Check
  const ip = getClientIp(request);
  const rateLimitResult = auditRateLimiter.check(ip);
  if (!rateLimitResult.ok) {
    return rateLimitExceededResponse(rateLimitResult.retryAfterSeconds);
  }

  // 2. Fast Content-Type Check
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Content-Type must be multipart/form-data." },
      { status: 400 }
    );
  }

  // 3. Fast Content-Length Check (allow margin for boundaries)
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declaredBytes = parseInt(contentLength, 10);
    if (Number.isFinite(declaredBytes) && declaredBytes > MAX_IMAGE_BYTES + 32 * 1024) {
      return NextResponse.json(
        { error: "Image file exceeds maximum allowed size of 4MB." },
        { status: 400 }
      );
    }
  }

  // 4. Parse Multipart Form Data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data." }, { status: 400 });
  }

  const file = formData.get("image");
  const isBlobLike =
    file &&
    typeof file !== "string" &&
    (file instanceof Blob || typeof (file as { arrayBuffer?: unknown }).arrayBuffer === "function");

  if (!isBlobLike) {
    return NextResponse.json({ error: "Missing or invalid 'image' form field." }, { status: 400 });
  }

  const imageFile = file as Blob;

  // 5. Enforce 4MB File Size Limit
  if (imageFile.size > MAX_IMAGE_BYTES || imageFile.size === 0) {
    return NextResponse.json(
      { error: "Image file must be between 1 byte and 4MB." },
      { status: 400 }
    );
  }

  // 6. Verify MIME Type
  const mimeType = imageFile.type.toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.includes(mimeType as (typeof ALLOWED_IMAGE_MIMES)[number])) {
    return NextResponse.json(
      { error: "Unsupported image format. Allowed formats: JPEG, PNG, WebP." },
      { status: 400 }
    );
  }

  // 7. Verify Actual Binary Contents via Magic Bytes
  const arrayBuffer = await imageFile.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const isValidMagic = verifyImageMagicBytes(bytes, mimeType);
  if (!isValidMagic) {
    return NextResponse.json(
      { error: "File contents do not match claimed image format." },
      { status: 400 }
    );
  }

  // 8. Convert to Base64 in Memory
  const base64Data = Buffer.from(arrayBuffer).toString("base64");

  // 9. Call Gemini Vision Server-Side (Zero Logging / No Disk Persistence)
  try {
    const result = await auditImageWithGemini(base64Data, mimeType);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const isApiKeyError = err instanceof Error && err.message.includes("GEMINI_API_KEY");
    if (isApiKeyError) {
      return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to audit image with AI." }, { status: 502 });
  }
}
