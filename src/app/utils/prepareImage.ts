/**
 * Browser-side preparation of a chosen profile photo, run before the form is
 * submitted.
 *
 * Two problems this solves:
 * - A phone photo is 3-5 MB and every byte crossed the network before the
 *   server ever resized it. Downscaling first makes the upload small.
 * - iPhones shoot HEIC by default, which no browser will submit as JPEG and
 *   `sharp` is not built to read here. Converting client-side means those
 *   uploads work instead of being rejected.
 *
 * The server still resizes and re-encodes whatever arrives -- this only makes
 * the upload leg cheaper and widens what the picker will accept. It never
 * makes the server's own validation redundant.
 */

/** Longest edge after downscaling. Above the server's 1200px "full" variant so
 *  the server still controls final quality, but far below a phone original. */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

/** Refuse absurd inputs outright rather than hanging the tab decoding them. */
const MAX_INPUT_BYTES = 50 * 1024 * 1024;
/** Must stay at or under next.config.ts `serverActions.bodySizeLimit`. */
const MAX_OUTPUT_BYTES = 10 * 1024 * 1024;

export interface PreparedImage {
  /** Always a JPEG, ready to submit. */
  file: File;
  /** Data URL for an <img> preview. */
  previewUrl: string;
}

export class ImagePrepError extends Error {}

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  // Safari often reports an empty type for HEIC, so trust the extension too.
  return (
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    file.type === "image/heic" ||
    file.type === "image/heif"
  );
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new ImagePrepError("Could not read that file."));
    reader.readAsDataURL(blob);
  });
}

/**
 * Decode to a bitmap with EXIF orientation applied.
 *
 * This matters: the server strips metadata when re-encoding without rotating,
 * so a photo taken sideways stays sideways. Baking the orientation in here
 * means the pixels are already the right way up.
 */
async function decode(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      // Fall through to the <img> path below.
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new ImagePrepError("That file isn't a readable image."));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new ImagePrepError("Could not process that image.")),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

/**
 * Convert (if needed), downscale and re-encode a chosen file to a JPEG.
 *
 * @throws ImagePrepError with a message safe to show the user.
 */
export async function prepareImageForUpload(input: File): Promise<PreparedImage> {
  if (input.size > MAX_INPUT_BYTES) {
    throw new ImagePrepError("That image is too large. Please choose one under 50MB.");
  }

  let source: Blob = input;

  if (isHeic(input)) {
    try {
      const { default: heic2any } = await import("heic2any");
      const converted = await heic2any({
        blob: input,
        toType: "image/jpeg",
        quality: JPEG_QUALITY,
      });
      source = Array.isArray(converted) ? converted[0] : (converted as Blob);
    } catch {
      throw new ImagePrepError(
        "Couldn't convert that HEIC photo. Please save it as JPEG and try again."
      );
    }
  }

  const bitmap = await decode(source);
  const width = "naturalWidth" in bitmap ? bitmap.naturalWidth : bitmap.width;
  const height = "naturalWidth" in bitmap ? bitmap.naturalHeight : bitmap.height;

  if (!width || !height) {
    throw new ImagePrepError("That file isn't a readable image.");
  }

  // Only ever shrink -- upscaling a small photo just wastes bytes.
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new ImagePrepError("Could not process that image.");
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if ("close" in bitmap) bitmap.close();

  const blob = await canvasToBlob(canvas);

  if (blob.size > MAX_OUTPUT_BYTES) {
    throw new ImagePrepError("That image is too large to upload. Please choose another.");
  }

  const baseName = input.name.replace(/\.[^.]+$/, "") || "profile";
  const file = new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  return { file, previewUrl: await readAsDataUrl(blob) };
}

/**
 * Put the processed file back into the <input type="file"> so the plain form
 * submission carries it instead of the original the user picked.
 *
 * Assigning `.files` does not fire a change event, so this cannot re-enter the
 * handler that called it.
 */
export function setInputFile(input: HTMLInputElement, file: File): void {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
}
