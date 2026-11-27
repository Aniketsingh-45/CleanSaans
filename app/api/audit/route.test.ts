/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auditRateLimiter } from "@/lib/security/rateLimit";
import { POST } from "./route";

function makeValidJpegFile(sizeBytes = 256, name = "test.jpg"): File {
  const bytes = new Uint8Array(sizeBytes);
  // JPEG magic bytes: 0xFF, 0xD8, 0xFF
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  bytes[3] = 0xe0;
  return new File([bytes], name, { type: "image/jpeg" });
}

function makeValidPngFile(sizeBytes = 256, name = "test.png"): File {
  const bytes = new Uint8Array(sizeBytes);
  // PNG magic bytes: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < pngHeader.length; i++) {
    bytes[i] = pngHeader[i]!;
  }
  return new File([bytes], name, { type: "image/png" });
}

describe("POST /api/audit", () => {
  const originalApiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    auditRateLimiter.reset();
    process.env.GEMINI_API_KEY = "test-gemini-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalApiKey;
    }
  });

  it("returns 200 with sorted leaks and burning status when valid image is uploaded and Gemini responds", async () => {
    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  leaks: [
                    {
                      issue: "Rasoi mein exhaust fan nahi hai",
                      why_it_matters: "Khana banate waqt PM2.5 500+ ho jata hai.",
                      fix: "Khidki kholi rakhein ya exhaust fan lagwayein.",
                      approx_cost_inr: 800,
                      effort: "med",
                    },
                    {
                      issue: "Khidkiyon ke side mein gaps",
                      why_it_matters: "Bahar ka smog seedhe andar aata hai.",
                      fix: "Weather strip foam tape lagayein.",
                      approx_cost_inr: 0,
                      effort: "low",
                    },
                  ],
                  burning_detected: false,
                  confidence: 0.92,
                }),
              },
            ],
          },
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockGeminiResponse,
    } as Response);

    const formData = new FormData();
    formData.append("image", makeValidJpegFile());

    const req = new Request("http://localhost:3000/api/audit", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.burning_detected).toBe(false);
    expect(json.confidence).toBe(0.92);
    expect(json.leaks).toHaveLength(2);

    // Verify sorted: free or cheapest fix first (cost 0 before cost 800)
    expect(json.leaks[0].approx_cost_inr).toBe(0);
    expect(json.leaks[1].approx_cost_inr).toBe(800);
  });

  it("returns 400 when Content-Type is not multipart/form-data", async () => {
    const req = new Request("http://localhost:3000/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: "base64" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/multipart\/form-data/i);
  });

  it("returns 400 when 'image' field is missing in form data", async () => {
    const formData = new FormData();
    formData.append("wrong_field", "value");

    const req = new Request("http://localhost:3000/api/audit", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/missing.*image/i);
  });

  it("returns 400 when uploaded image exceeds 4MB size ceiling", async () => {
    // 4MB + 1KB
    const oversizeBytes = 4 * 1024 * 1024 + 1024;
    const oversizeFile = makeValidJpegFile(oversizeBytes);

    const formData = new FormData();
    formData.append("image", oversizeFile);

    const req = new Request("http://localhost:3000/api/audit", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/4MB/i);
  });

  it("returns 400 when image MIME type is unsupported", async () => {
    const pdfFile = new File([new Uint8Array(100)], "doc.pdf", {
      type: "application/pdf",
    });

    const formData = new FormData();
    formData.append("image", pdfFile);

    const req = new Request("http://localhost:3000/api/audit", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/unsupported image format/i);
  });

  it("returns 400 when magic bytes do not match the claimed MIME type", async () => {
    // Plain text bytes with claimed type image/jpeg
    const fakeBytes = new TextEncoder().encode("This is not a real JPEG file, just plain text.");
    const fakeJpeg = new File([fakeBytes], "fake.jpg", {
      type: "image/jpeg",
    });

    const formData = new FormData();
    formData.append("image", fakeJpeg);

    const req = new Request("http://localhost:3000/api/audit", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/do not match claimed image format/i);
  });

  it("rate limits client requests to 20 per minute returning HTTP 429 with Retry-After", async () => {
    const mockGeminiResponse = {
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
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockGeminiResponse,
    } as Response);

    // Perform 20 allowed requests
    for (let i = 0; i < 20; i++) {
      const formData = new FormData();
      formData.append("image", makeValidPngFile());

      const req = new Request("http://localhost:3000/api/audit", {
        method: "POST",
        headers: { "x-forwarded-for": "192.168.1.100" },
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    }

    // 21st request must be rate limited
    const blockedFormData = new FormData();
    blockedFormData.append("image", makeValidPngFile());

    const blockedReq = new Request("http://localhost:3000/api/audit", {
      method: "POST",
      headers: { "x-forwarded-for": "192.168.1.100" },
      body: blockedFormData,
    });

    const blockedRes = await POST(blockedReq);
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get("Retry-After")).toBeDefined();
  });

  it("returns 500 when GEMINI_API_KEY is not configured", async () => {
    delete process.env.GEMINI_API_KEY;

    const formData = new FormData();
    formData.append("image", makeValidJpegFile());

    const req = new Request("http://localhost:3000/api/audit", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toMatch(/Gemini API key/i);
  });

  it("retries once when Gemini returns invalid JSON, and returns 502 if retry also fails", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: "THIS_IS_NOT_VALID_JSON" }],
            },
          },
        ],
      }),
    } as Response);

    const formData = new FormData();
    formData.append("image", makeValidJpegFile());

    const req = new Request("http://localhost:3000/api/audit", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    // Should have retried once (2 calls total)
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(502);

    const json = await res.json();
    expect(json.error).toMatch(/Failed to audit image with AI/i);
  });
});
