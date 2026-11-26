import { NextResponse } from "next/server";
import { type z } from "zod";

export const DEFAULT_MAX_JSON_BYTES = 100 * 1024; // 100 KB default limit for JSON payloads

export type ParseJsonResult<T> =
  { success: true; data: T } | { success: false; response: NextResponse };

/**
 * Safely parses and validates a JSON request body against a Zod schema.
 *
 * Security measures:
 * - Strictly enforces Content-Type to application/json.
 * - Rejects oversized payloads (checks Content-Length header and actual byte length).
 * - Never echoes internal exception details, Zod issue paths, or stack traces to client.
 * - Never logs request bodies, API keys, or tokens.
 */
export async function parseJson<T>(
  request: Request,
  schema: z.ZodType<T>,
  maxBytes: number = DEFAULT_MAX_JSON_BYTES
): Promise<ParseJsonResult<T>> {
  const genericErrorResponse = (message = "Invalid request payload.", status = 400): NextResponse =>
    NextResponse.json({ error: message }, { status });

  // 1. Verify Content-Type
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    return {
      success: false,
      response: genericErrorResponse("Content-Type must be application/json.", 400),
    };
  }

  // 2. Fast-path check on Content-Length header
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declaredBytes = parseInt(contentLength, 10);
    if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
      return {
        success: false,
        response: genericErrorResponse("Request payload exceeds size limit.", 400),
      };
    }
  }

  // 3. Read body text safely
  let rawText: string;
  try {
    rawText = await request.text();
  } catch {
    return {
      success: false,
      response: genericErrorResponse("Unable to read request payload.", 400),
    };
  }

  // 4. Verify actual byte size
  const actualBytes = new TextEncoder().encode(rawText).length;
  if (actualBytes > maxBytes) {
    return {
      success: false,
      response: genericErrorResponse("Request payload exceeds size limit.", 400),
    };
  }

  // 5. Parse JSON
  let rawJson: unknown;
  try {
    rawJson = JSON.parse(rawText);
  } catch {
    return {
      success: false,
      response: genericErrorResponse("Malformed JSON in request payload.", 400),
    };
  }

  // 6. Validate against Zod schema safely without leaking stack traces or internal structure
  const validation = schema.safeParse(rawJson);
  if (!validation.success) {
    return {
      success: false,
      response: genericErrorResponse("Invalid request payload.", 400),
    };
  }

  return {
    success: true,
    data: validation.data,
  };
}
