import sharp from 'sharp';

/**
 * Image size variants for different use cases
 */
export interface ImageVariants {
  thumbnail: Buffer;  // 400px width - for cards/lists
  medium: Buffer;     // 800px width - for smaller screens
  full: Buffer;       // 1200px width - for profile pages
}

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

/**
 * Generates multiple image size variants for responsive loading
 * - Thumbnail: 400px width (for cards/grid views)
 * - Medium: 800px width (for smaller screens)
 * - Full: 1200px width (for profile pages/large screens)
 * 
 * @param file - The image file to process
 * @returns Object with all three size variants as buffers
 */
export async function generateImageVariants(file: File): Promise<ImageVariants> {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const sourceBuffer = Buffer.from(arrayBuffer);
    
    // Create a sharp instance from the source
    const image = sharp(sourceBuffer);
    
    // Generate all three sizes in parallel for better performance
    const [thumbnail, medium, full] = await Promise.all([
      // Thumbnail: 400px width for cards
      image
        .clone()
        .resize(400, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer(),
      
      // Medium: 800px width for smaller screens
      image
        .clone()
        .resize(800, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer(),
      
      // Full: 1200px width for profile pages
      image
        .clone()
        .resize(1200, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer(),
    ]);
    
    return { thumbnail, medium, full };
  } catch (error) {
    console.error('Image variant generation error:', error);
    throw new Error('Failed to generate image variants. Please try a different image.');
  }
}
