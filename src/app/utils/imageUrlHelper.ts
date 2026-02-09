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
