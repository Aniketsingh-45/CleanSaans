export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB

export const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];

/**
 * Validates actual binary contents against claimed MIME type using file magic bytes.
 * Never trusts client Content-Type headers alone.
 *
 * Supported signatures:
 * - JPEG: 0xFF, 0xD8, 0xFF
 * - PNG:  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
 * - WebP: 'RIFF' at 0..3 and 'WEBP' at 8..11
 */
export function verifyImageMagicBytes(buffer: Uint8Array, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  const normalizedMime = mimeType.toLowerCase().trim();

  // 1. JPEG: 0xFF, 0xD8, 0xFF
  if (normalizedMime === "image/jpeg" || normalizedMime === "image/jpg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // 2. PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (normalizedMime === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // 3. WebP: RIFF (bytes 0-3: 0x52, 0x49, 0x46, 0x46) and WEBP (bytes 8-11: 0x57, 0x45, 0x42, 0x50)
  if (normalizedMime === "image/webp") {
    const isRiff =
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  return false;
}
