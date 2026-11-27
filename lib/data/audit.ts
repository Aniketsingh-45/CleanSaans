import { z } from "zod";

export const AuditLeakSchema = z.object({
  issue: z.string().min(1),
  why_it_matters: z.string().min(1),
  fix: z.string().min(1),
  approx_cost_inr: z.number().nonnegative(),
  effort: z.enum(["low", "med", "high"]),
});

export const AuditResponseSchema = z.object({
  leaks: z.array(AuditLeakSchema).max(3),
  burning_detected: z.boolean(),
  confidence: z.number().min(0).max(1),
});

export type AuditLeak = z.infer<typeof AuditLeakSchema>;
export type AuditResponse = z.infer<typeof AuditResponseSchema>;

export const AUDIT_SYSTEM_PROMPT =
  "You audit Indian households for air pollution leaks. Look at the photo and return ONLY JSON: {leaks:[{issue, why_it_matters, fix, approx_cost_inr, effort:'low'|'med'|'high'}], burning_detected:boolean, confidence:number}. Max 3 leaks. Free or cheapest fixes first. No medical diagnosis. If the image is unrelated, return empty leaks. Never output exposure or health numbers.";

/**
 * Sends base64 image data to Gemini Vision for an air pollution audit.
 * - Strict schema validation with Zod
 * - Retries once on invalid JSON or schema failure
 * - Sorts leaks with free or cheapest fixes first
 * - Returns a clear error if failed (no fake data)
 * - Never logs or persists image payloads
 */
export async function auditImageWithGemini(
  base64Data: string,
  mimeType: string,
  apiKey: string = process.env.GEMINI_API_KEY ?? "",
  model: string = process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest",
  timeoutMs: number = 15_000
): Promise<AuditResponse> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const requestBody = {
    systemInstruction: {
      parts: [{ text: AUDIT_SYSTEM_PROMPT }],
    },
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: "Audit this household photo for air pollution leaks, infiltration gaps, biomass/incense/waste burning, or indoor emission sources.",
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.2,
    },
  };

  let activeModel = model;
  let lastError: Error | null = null;

  // Try initial attempt + 1 retry (2 attempts total)
  for (let attempt = 1; attempt <= 2; attempt++) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(activeModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        lastError = new Error(`Gemini API error (HTTP ${response.status})`);
        // If quota exceeded (429) or model not found (404), fall back to gemini-flash-lite-latest on retry
        if (
          (response.status === 429 || response.status === 404) &&
          activeModel !== "gemini-flash-lite-latest"
        ) {
          activeModel = "gemini-flash-lite-latest";
        }
        continue;
      }

      const json = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        lastError = new Error("Gemini returned empty text candidate.");
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        lastError = new Error("Gemini returned invalid JSON.");
        continue;
      }

      const validated = AuditResponseSchema.parse(parsed);

      // Sort leaks: free or cheapest fixes first (approx_cost_inr ascending)
      validated.leaks.sort((a, b) => a.approx_cost_inr - b.approx_cost_inr);

      return validated;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Will attempt retry if attempt === 1
    }
  }

  throw lastError ?? new Error("Failed to audit image with AI after retry.");
}
