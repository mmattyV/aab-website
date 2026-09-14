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
  
    // ✅ Make `image` fully optional and skip validation if no file is provided
    image: z
      .union([z.instanceof(File), z.null(), z.undefined()]) // Allow null and undefined
      .refine(
        (file) => {
          // Skip validation if no file is provided. An untouched file input
          // still submits an empty File, which is not an upload either.
          if (!file || !(file instanceof File) || file.size === 0) {
            return true; // No file, so validation passes
          }
  
          // Validate file extension
          const allowedExtensions = ["jpeg", "jpg", "png"];
          const extension = file.name.split(".").pop()?.toLowerCase();
          if (!extension || !allowedExtensions.includes(extension)) {
            return false; // Invalid extension
          }
  
          // Validate MIME type
          const allowedMimeTypes = ["image/jpeg", "image/png"];
          if (!allowedMimeTypes.includes(file.type)) {
            return false; // Invalid MIME type
          }
  
          return true; // File is valid
        },
        {
          message: "Only JPEG, JPG, and PNG files are allowed.", // Custom error message
        }
      ),
  });