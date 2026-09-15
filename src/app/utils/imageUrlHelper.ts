/**
 * Helper functions for managing multiple image size URLs
 * Provides backwards compatibility with single URL format
 */

export interface ImageUrls {
  thumbnail: string;
  medium: string;
  full: string;
}

/**
 * Parse image_url field which can be either:
 * - A JSON string with thumbnail, medium, full URLs
 * - A plain URL string (legacy format)
 * 
 * @param imageUrlField - The image_url value from database
 * @returns ImageUrls object with all three sizes
 */
export function parseImageUrl(imageUrlField: string): ImageUrls {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(imageUrlField);
    if (parsed.thumbnail && parsed.medium && parsed.full) {
      return parsed;
    }
  } catch {
    // Not JSON, treat as plain URL
  }
  
  // If not JSON or invalid structure, use the URL for all sizes (backwards compatible)
  return {
    thumbnail: imageUrlField,
    medium: imageUrlField,
    full: imageUrlField,
  };
}

/**
 * Convert ImageUrls object to JSON string for storage
 * 
 * @param urls - ImageUrls object
 * @returns JSON string for database storage
 */
export function serializeImageUrls(urls: ImageUrls): string {
  return JSON.stringify(urls);
}

/**
 * Get the appropriate image URL based on usage context
 * 
 * @param imageUrlField - The image_url value from database
 * @param size - Which size to retrieve
 * @returns The URL for the requested size
 */
export function getImageUrl(imageUrlField: string, size: 'thumbnail' | 'medium' | 'full' = 'full'): string {
  const urls = parseImageUrl(imageUrlField);
  return urls[size];
}

/**
 * Only blobs we actually own may be passed to the blob delete API. Local paths
 * such as "/profile-image.jpg" and placeholder URLs must never reach it.
 *
 * @param url - Candidate URL
 * @returns True if this is a Vercel Blob URL we can safely delete
 */
export function isBlobUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length === 0) return false;
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/**
 * Pull every stored URL out of an image_url value, handling both the JSON
 * multi-size format and the legacy single-URL format.
 *
 * Unlike parseImageUrl this does not fall back to duplicating a single URL
 * across all three sizes -- callers use it to decide what to delete, so it
 * returns exactly what is stored and nothing more.
 *
 * @param imageUrlField - The image_url value from database
 * @returns Every distinct URL referenced by the field
 */
export function extractImageUrls(
  imageUrlField: string | null | undefined
): string[] {
  if (typeof imageUrlField !== "string") return [];
  const trimmed = imageUrlField.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object") {
      return [parsed.thumbnail, parsed.medium, parsed.full].filter(
        (url): url is string => typeof url === "string" && url.length > 0
      );
    }
  } catch {
    // Not JSON -- fall through and treat it as a legacy single URL.
  }

  return [trimmed];
}
