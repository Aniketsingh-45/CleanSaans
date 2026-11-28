/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AskRequestSchema,
  AskResponseSchema,
  askCleanSaansWithGemini,
  getFriendlyFallback,
  MAX_ANSWER_CHARS,
} from "./ask";

describe("ask module", () => {
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

  describe("getFriendlyFallback", () => {
    it("returns Hindi message for 'hi'", () => {
      const msg = getFriendlyFallback("hi");
      expect(msg).toContain("AQI");
      expect(msg).toContain("डॉक्टर");
    });

    it("returns English message for 'en'", () => {
      const msg = getFriendlyFallback("en");
      expect(msg).toContain("Sorry, we could not generate an answer");
      expect(msg).toContain("doctor");
    });

    it("returns Hinglish message for 'hinglish' and default", () => {
      const msg = getFriendlyFallback("hinglish");
      expect(msg).toContain("Maaf kijiye, abhi answer taiyaar nahi ho paya");
      expect(getFriendlyFallback()).toBe(msg);
    });
  });

  describe("AskRequestSchema & AskResponseSchema", () => {
    it("validates and trims valid question", () => {
      const parsed = AskRequestSchema.parse({
        question: "  Kya subah daudna safe hai?  ",
        language: "hinglish",
      });
      expect(parsed.question).toBe("Kya subah daudna safe hai?");
      expect(parsed.language).toBe("hinglish");
    });

    it("rejects empty question or question over 500 chars", () => {
      expect(() => AskRequestSchema.parse({ question: "" })).toThrow();
      expect(() => AskRequestSchema.parse({ question: "a".repeat(501) })).toThrow();
    });

    it("validates AskResponseSchema", () => {
      const valid = AskResponseSchema.parse({
        answer: "Subah ke waqt mask pehnein.",
        source: "ai",
      });
      expect(valid.source).toBe("ai");
    });
  });

  describe("askCleanSaansWithGemini", () => {
    it("returns fallback when apiKey is missing", async () => {
      delete process.env.GEMINI_API_KEY;
      const res = await askCleanSaansWithGemini({
        question: "Kaise bachein?",
        language: "hinglish",
      });
      expect(res.source).toBe("fallback");
      expect(res.answer).toContain("Maaf kijiye");
    });

    it("returns AI answer when Gemini responds successfully", async () => {
      const mockAnswer = "Subah ke waqt N95 mask zaroor pehnein aur khidkiyan band rakhein.";
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: mockAnswer }],
              },
            },
          ],
        }),
      } as Response);

      const res = await askCleanSaansWithGemini({
        question: "Mask kab pehnein?",
        language: "hinglish",
      });

      expect(res.source).toBe("ai");
      expect(res.answer).toBe(mockAnswer);
    });

    it("retries with gemini-flash-lite-latest when primary model encounters 429", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        // First call: 429
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
        } as Response)
        // Second call: success on flash-lite
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: "Lite model answer" }],
                },
              },
            ],
          }),
        } as Response);

      const res = await askCleanSaansWithGemini(
        { question: "Purifier kab chalayein?", language: "hinglish" },
        "test-key",
        "gemini-2.5-flash"
      );

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy.mock.calls[1]?.[0]).toContain("gemini-flash-lite-latest");
      expect(res.source).toBe("ai");
      expect(res.answer).toBe("Lite model answer");
    });

    it("returns fallback when upstream HTTP status is not ok on all attempts", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const res = await askCleanSaansWithGemini({
        question: "Help",
        language: "en",
      });

      expect(res.source).toBe("fallback");
      expect(res.answer).toContain("Sorry, we could not generate an answer");
    });

    it("returns fallback when text candidate is empty or exceeds MAX_ANSWER_CHARS", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "   " }] } }],
        }),
      } as Response);

      const resEmpty = await askCleanSaansWithGemini({
        question: "Test",
        language: "hi",
      });
      expect(resEmpty.source).toBe("fallback");

      // Too long
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "x".repeat(MAX_ANSWER_CHARS + 10) }],
              },
            },
          ],
        }),
      } as Response);

      const resLong = await askCleanSaansWithGemini({
        question: "Test",
        language: "hinglish",
      });
      expect(resLong.source).toBe("fallback");
    });

    it("returns fallback when fetch throws a network error", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network timeout"));

      const res = await askCleanSaansWithGemini({
        question: "Any tips?",
        language: "hinglish",
      });

      expect(res.source).toBe("fallback");
    });
  });
});
