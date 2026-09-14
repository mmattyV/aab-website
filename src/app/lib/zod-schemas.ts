import { z } from "zod";

// Just your schemas:
export const BrotherSchema = z.object({
  personal_email: z.string().email(),
  school_email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  year: z.string().regex(/^\d{4}$/),
  phone: z.string().min(1),
  house: z.string().min(1),
  brother_name: z.string().min(1),
  birthday: z.string(),
  location: z.string().min(1),
  tagline: z.string().min(1),
  position: z.string().min(1),
  bio: z.string().min(1),
  instagram: z.string().optional(),
  // Instead of inline arrow function, define it separately or inline:
  image: z
    .instanceof(File)
    .refine((file) => {
      const allowedExtensions = ['jpeg', 'jpg', 'png'];
      const extension = file.name.split('.').pop()?.toLowerCase();
      return extension && allowedExtensions.includes(extension);
    }, "Only JPEG, JPG, and PNG files are allowed.")
    .refine((file) => {
      const allowedMimeTypes = ['image/jpeg', 'image/png'];
      return allowedMimeTypes.includes(file.type);
    }, "Invalid image file type."),
});

export const RecruitSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  year: z.string().regex(/^\d{4}$/),
  phone: z.string().min(1),
  room: z.string().min(1),
  image: z
    .instanceof(File)
    .refine((file) => {
      const allowedExtensions = ['jpeg', 'jpg', 'png'];
      const extension = file.name.split('.').pop()?.toLowerCase();
      return extension && allowedExtensions.includes(extension);
    }, "Only JPEG, JPG, and PNG files are allowed.")
    .refine((file) => {
      const allowedMimeTypes = ['image/jpeg', 'image/png'];
      return allowedMimeTypes.includes(file.type);
    }, "Invalid image file type."),
});

/**
 * A replacement photo that may be left out entirely.
 *
 * An untouched file input still submits an empty `File`, so a zero-byte file
 * counts as "no upload" rather than as an invalid one.
 */
const OptionalImageSchema = z
  .union([z.instanceof(File), z.null(), z.undefined()])
  .refine(
    (file) => {
      if (!file || !(file instanceof File) || file.size === 0) {
        return true;
      }

      const allowedExtensions = ["jpeg", "jpg", "png"];
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        return false;
      }

      const allowedMimeTypes = ["image/jpeg", "image/png"];
      return allowedMimeTypes.includes(file.type);
    },
    { message: "Only JPEG, JPG, and PNG files are allowed." }
  );

export const EditBrotherSchema = z.object({
    brotherId: z.string().uuid(),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    personal_email: z.string().email(),
    school_email: z.string().email(),
    year: z.string().regex(/^\d{4}$/),
    phone: z.string().min(1),
    house: z.string().min(1),
    brother_name: z.string().min(1),
    birthday: z.string(),
    location: z.string().min(1),
    tagline: z.string().min(1),
    position: z.string().min(1),
    bio: z.string().min(1),
    instagram: z.string().optional(),
  
    // ✅ Leaving the picker untouched keeps the current picture
    image: OptionalImageSchema,
  });

/** Every recruit field, with the photo optional so an edit can keep the current one. */
export const EditRecruitSchema = z.object({
  recruitId: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  year: z.string().regex(/^\d{4}$/),
  phone: z.string().min(1),
  room: z.string().min(1),
  image: OptionalImageSchema,
});