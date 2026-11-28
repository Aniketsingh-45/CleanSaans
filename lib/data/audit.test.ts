/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUDIT_SYSTEM_PROMPT,
  AuditLeakSchema,
  AuditResponseSchema,
  auditImageWithGemini,
} from "./audit";

describe("audit module", () => {
  const originalApiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-api-key";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalApiKey;
    }
  });

  it("exports AUDIT_SYSTEM_PROMPT with rules", () => {
    expect(AUDIT_SYSTEM_PROMPT).toContain("Indian households");
    expect(AUDIT_SYSTEM_PROMPT).toContain("Max 3 leaks");
  });

  it("validates AuditLeakSchema and AuditResponseSchema", () => {
    const leak = AuditLeakSchema.parse({
      issue: "Gap under door",
      why_it_matters: "Smog enters",
      fix: "Install door sweep",
      approx_cost_inr: 250,
      effort: "low",
    });
    expect(leak.effort).toBe("low");

    const auditRes = AuditResponseSchema.parse({
      leaks: [leak],
      burning_detected: true,
      confidence: 0.95,
    });
    expect(auditRes.burning_detected).toBe(true);
  });

  describe("auditImageWithGemini", () => {
    it("throws error when apiKey is missing", async () => {
      delete process.env.GEMINI_API_KEY;
      await expect(auditImageWithGemini("base64data", "image/jpeg", "")).rejects.toThrow(
        /GEMINI_API_KEY is not configured/i
      );
    });

    it("parses valid response and sorts leaks with cheapest fixes first", async () => {
      const mockResult = {
        leaks: [
          {
            issue: "High cost leak",
            why_it_matters: "Bad air",
            fix: "Expensive filter",
            approx_cost_inr: 3000,
            effort: "high",
          },
          {
            issue: "Free leak",
            why_it_matters: "Direct smoke",
            fix: "Close window during peak hours",
            approx_cost_inr: 0,
            effort: "low",
          },
          {
            issue: "Mid cost leak",
            why_it_matters: "Kitchen smoke",
            fix: "Exhaust tape",
            approx_cost_inr: 150,
            effort: "low",
          },
        ],
        burning_detected: false,
        confidence: 0.88,
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockResult) }],
              },
            },
          ],
        }),
      } as Response);

      const result = await auditImageWithGemini("base64data", "image/jpeg", "test-key");
      expect(result.leaks).toHaveLength(3);
      // Sorted: 0 -> 150 -> 3000
      expect(result.leaks[0]?.approx_cost_inr).toBe(0);
      expect(result.leaks[1]?.approx_cost_inr).toBe(150);
      expect(result.leaks[2]?.approx_cost_inr).toBe(3000);
      expect(result.burning_detected).toBe(false);
    });

    it("retries with gemini-flash-lite-latest when 429 is encountered", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        leaks: [],
                        burning_detected: true,
                        confidence: 0.9,
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        } as Response);

      const result = await auditImageWithGemini(
        "base64data",
        "image/png",
        "key",
        "gemini-2.5-flash"
      );
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy.mock.calls[1]?.[0]).toContain("gemini-flash-lite-latest");
      expect(result.burning_detected).toBe(true);
    });

    it("retries when candidate has empty text or invalid JSON and succeeds on retry", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: "" }] } }],
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        leaks: [],
                        burning_detected: false,
                        confidence: 0.8,
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        } as Response);

      const result = await auditImageWithGemini("base64data", "image/jpeg", "key");
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result.confidence).toBe(0.8);
    });

    it("throws error when all attempts fail", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(auditImageWithGemini("base64data", "image/jpeg", "key")).rejects.toThrow(
        /Gemini API error/i
      );
    });
  });
});
