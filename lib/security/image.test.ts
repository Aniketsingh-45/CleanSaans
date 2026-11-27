import { describe, expect, it } from "vitest";
import { ALLOWED_IMAGE_MIMES, MAX_IMAGE_BYTES, verifyImageMagicBytes } from "./image";

describe("lib/security/image - verifyImageMagicBytes", () => {
  it("exports expected constants", () => {
    expect(MAX_IMAGE_BYTES).toBe(4 * 1024 * 1024);
    expect(ALLOWED_IMAGE_MIMES).toEqual(["image/jpeg", "image/png", "image/webp"]);
  });

  it("validates JPEG file signatures correctly", () => {
    const validJpeg = new Uint8Array(16);
    validJpeg[0] = 0xff;
    validJpeg[1] = 0xd8;
    validJpeg[2] = 0xff;
    validJpeg[3] = 0xe0;

    expect(verifyImageMagicBytes(validJpeg, "image/jpeg")).toBe(true);
    expect(verifyImageMagicBytes(validJpeg, "image/jpg")).toBe(true);
    expect(verifyImageMagicBytes(validJpeg, "  IMAGE/JPEG  ")).toBe(true);

    const invalidJpeg = new Uint8Array(16);
    invalidJpeg[0] = 0xff;
    invalidJpeg[1] = 0x00;
    invalidJpeg[2] = 0xff;
    expect(verifyImageMagicBytes(invalidJpeg, "image/jpeg")).toBe(false);
  });

  it("validates PNG file signatures correctly", () => {
    const validPng = new Uint8Array(16);
    const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < pngHeader.length; i++) {
      validPng[i] = pngHeader[i]!;
    }

    expect(verifyImageMagicBytes(validPng, "image/png")).toBe(true);
    expect(verifyImageMagicBytes(validPng, "IMAGE/PNG")).toBe(true);

    const invalidPng = new Uint8Array(validPng);
    invalidPng[1] = 0x00;
    expect(verifyImageMagicBytes(invalidPng, "image/png")).toBe(false);
  });

  it("validates WebP file signatures correctly (RIFF + WEBP)", () => {
    const validWebp = new Uint8Array(16);
    // RIFF
    validWebp[0] = 0x52;
    validWebp[1] = 0x49;
    validWebp[2] = 0x46;
    validWebp[3] = 0x46;
    // Length in bytes 4..7 (can be arbitrary)
    validWebp[4] = 0x00;
    validWebp[5] = 0x00;
    validWebp[6] = 0x00;
    validWebp[7] = 0x00;
    // WEBP
    validWebp[8] = 0x57;
    validWebp[9] = 0x45;
    validWebp[10] = 0x42;
    validWebp[11] = 0x50;

    expect(verifyImageMagicBytes(validWebp, "image/webp")).toBe(true);
    expect(verifyImageMagicBytes(validWebp, "IMAGE/WEBP")).toBe(true);

    // Corrupted RIFF
    const badRiff = new Uint8Array(validWebp);
    badRiff[0] = 0x00;
    expect(verifyImageMagicBytes(badRiff, "image/webp")).toBe(false);

    // Corrupted WEBP
    const badWebp = new Uint8Array(validWebp);
    badWebp[8] = 0x00;
    expect(verifyImageMagicBytes(badWebp, "image/webp")).toBe(false);
  });

  it("rejects buffers shorter than 12 bytes", () => {
    const shortBuffer = new Uint8Array([0xff, 0xd8, 0xff]);
    expect(verifyImageMagicBytes(shortBuffer, "image/jpeg")).toBe(false);
  });

  it("rejects mismatched MIME type against valid byte signature", () => {
    const validJpeg = new Uint8Array(16);
    validJpeg[0] = 0xff;
    validJpeg[1] = 0xd8;
    validJpeg[2] = 0xff;

    // Claims to be PNG but is JPEG
    expect(verifyImageMagicBytes(validJpeg, "image/png")).toBe(false);
    // Claims to be WebP but is JPEG
    expect(verifyImageMagicBytes(validJpeg, "image/webp")).toBe(false);
  });

  it("rejects unsupported MIME types", () => {
    const buffer = new Uint8Array(16);
    expect(verifyImageMagicBytes(buffer, "image/gif")).toBe(false);
    expect(verifyImageMagicBytes(buffer, "application/pdf")).toBe(false);
    expect(verifyImageMagicBytes(buffer, "text/plain")).toBe(false);
  });
});
