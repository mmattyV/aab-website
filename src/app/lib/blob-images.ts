/**
 * Shared lifecycle helpers for profile images stored in Vercel Blob.
 *
 * Every profile image is stored as three blob objects (thumbnail / medium /
 * full) whose URLs are serialized into the single `image_url` column. Because
 * the blob write and the database write are two separate systems, any path that
 * uploads or replaces an image has to clean up after itself when the other half
 * fails -- otherwise the blobs stay in storage with nothing referencing them.
 */

import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";
import { generateImageVariants } from "@/app/utils/compressImage";
import { sanitizeFilename } from "@/app/utils/sanitizeFilename";
import {
  serializeImageUrls,
  isBlobUrl,
  extractImageUrls,
} from "@/app/utils/imageUrlHelper";

// Re-exported so callers have a single import site for image lifecycle work.
export { isBlobUrl, extractImageUrls };

export type ProfileImagePrefix = "brother-profile" | "recruit-profile";

export interface UploadedProfileImage {
  /** JSON string to store in the `image_url` column. */
  serialized: string;
  /** Every blob URL that was created, for rollback on a later failure. */
  urls: string[];
}

/**
 * Delete blob objects and wait for the result.
 *
 * This is deliberately awaited rather than fire-and-forget: on serverless the
 * function can be frozen as soon as the response is sent, which would leave
 * detached promises unfinished and the blobs orphaned. Failures are logged
 * instead of thrown so a cleanup problem never fails the caller's request.
 */
export async function deleteImageUrls(urls: string[]): Promise<void> {
  const blobUrls = Array.from(new Set(urls.filter(isBlobUrl)));
  if (blobUrls.length === 0) return;

  try {
    await del(blobUrls);
  } catch (error) {
    console.error("Batch blob deletion failed, retrying individually:", error);
    await Promise.all(
      blobUrls.map((url) =>
        del(url).catch((individualError) => {
          console.error(`Failed to delete blob: ${url}`, individualError);
        })
      )
    );
  }
}

/** Convenience wrapper: delete every variant referenced by an `image_url` value. */
export async function deleteImagesForField(
  imageUrlField: string | null | undefined
): Promise<void> {
  await deleteImageUrls(extractImageUrls(imageUrlField));
}

/**
 * Generate and upload the three size variants for a profile image.
 *
 * If any single upload fails, the ones that already succeeded are deleted
 * before the error propagates, so a partial upload never leaves stray blobs.
 */
export async function uploadProfileImageVariants(
  file: File,
  prefix: ProfileImagePrefix
): Promise<UploadedProfileImage> {
  const variants = await generateImageVariants(file);
  const baseFileName = `${prefix}-${randomUUID()}-${sanitizeFilename(file.name)}`;

  const results = await Promise.allSettled([
    put(`${baseFileName}-thumb.jpg`, variants.thumbnail, {
      access: "public",
      contentType: "image/jpeg",
    }),
    put(`${baseFileName}-medium.jpg`, variants.medium, {
      access: "public",
      contentType: "image/jpeg",
    }),
    put(`${baseFileName}-full.jpg`, variants.full, {
      access: "public",
      contentType: "image/jpeg",
    }),
  ]);

  const uploadedUrls = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value.url);

  const firstFailure = results.find((result) => result.status === "rejected");
  if (firstFailure) {
    await deleteImageUrls(uploadedUrls);
    throw firstFailure.reason instanceof Error
      ? firstFailure.reason
      : new Error("Failed to upload one or more image variants.");
  }

  const [thumbnail, medium, full] = uploadedUrls;
  return {
    serialized: serializeImageUrls({ thumbnail, medium, full }),
    urls: uploadedUrls,
  };
}
