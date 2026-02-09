import sharp from 'sharp';

/**
 * Compresses and optimizes an image file
 * - Resizes to max width of 1200px (maintains aspect ratio)
 * - Converts to JPEG with 85% quality
 * - Strips metadata
 * 
 * @param file - The image file to compress
 * @returns Object with compressed buffer and content type
 */
export async function compressImage(file: File): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Compress and optimize with Sharp
    const compressed = await sharp(buffer)
      .resize(1200, null, { 
        withoutEnlargement: true, // Don't upscale smaller images
        fit: 'inside' // Maintain aspect ratio
      })
      .jpeg({ 
        quality: 85, // Good balance between quality and size
        progressive: true // Progressive loading
      })
      .toBuffer();
    
    return { 
      buffer: compressed, 
      contentType: 'image/jpeg' 
    };
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error('Failed to compress image. Please try a different image.');
  }
}
