import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseJson } from "./validate";

const TestSchema = z.object({
  city: z.string().min(1),
  residents: z.number().int().positive(),
});

describe("parseJson validation helper", () => {
  it("successfully parses valid JSON matching the schema", async () => {
    const validBody = JSON.stringify({ city: "Delhi", residents: 4 });
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: validBody,
    });

    const result = await parseJson(req, TestSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ city: "Delhi", residents: 4 });
    }
  });

  it("rejects non-JSON content-type with safe 400", async () => {
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "plain text",
    });

    const result = await parseJson(req, TestSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const json = (await result.response.json()) as { error: string };
      expect(json.error).toBe("Content-Type must be application/json.");
    }
  });

  it("rejects payload exceeding maxBytes via Content-Length header with safe 400", async () => {
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": "5000",
      },
      body: JSON.stringify({ city: "Delhi", residents: 2 }),
    });

    const result = await parseJson(req, TestSchema, 1000); // 1 KB max
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const json = (await result.response.json()) as { error: string };
      expect(json.error).toBe("Request payload exceeds size limit.");
    }
  });

  it("rejects payload exceeding actual byte size with safe 400", async () => {
    const hugeString = "a".repeat(1500);
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ city: hugeString, residents: 1 }),
    });

    const result = await parseJson(req, TestSchema, 1000);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const json = (await result.response.json()) as { error: string };
      expect(json.error).toBe("Request payload exceeds size limit.");
    }
  });

  it("rejects malformed JSON with safe 400 without leaking stack traces", async () => {
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ not a json ",
    });

    const result = await parseJson(req, TestSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const json = (await result.response.json()) as { error: string };
      expect(json.error).toBe("Malformed JSON in request payload.");
      // Ensure no stack traces or syntax error internals leak
      expect(JSON.stringify(json)).not.toContain("SyntaxError");
      expect(JSON.stringify(json)).not.toContain("at ");
    }
  });

  it("rejects invalid schema with safe 400 and generic message (never echoing internals)", async () => {
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ city: 12345, residents: -5 }),
    });

    const result = await parseJson(req, TestSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const json = (await result.response.json()) as { error: string };
      expect(json.error).toBe("Invalid request payload.");
      // Never echo Zod internal issue arrays or paths
      expect(JSON.stringify(json)).not.toContain("issues");
      expect(JSON.stringify(json)).not.toContain("stack");
    }
  });
});
