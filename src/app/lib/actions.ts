"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { BrotherSchema, RecruitSchema, EditBrotherSchema } from "./zod-schemas";
import bcrypt from "bcrypt";
import { validateImageFile } from "@/app/utils/validateImage";
import {
  uploadProfileImageVariants,
  deleteImageUrls,
  extractImageUrls,
  type UploadedProfileImage,
} from "@/app/lib/blob-images";

// ============= AUTH / SIGNIN / SIGNOUT =================
export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function serverSignOut() {
  await signOut({ redirectTo: "/" });
}

// ============= COMMENT SCHEMAS / ACTIONS ==============

const CommentSchema = z.object({
  recruitId: z.string().min(1, { message: "Recruit ID is required." }),
  brotherId: z.string().min(1, { message: "Brother ID is required." }),
  comment: z.string().optional(),
  redFlag: z.string().optional(),
});

export type State = {
  errors?: Record<string, string[]>;
  message?: string | null;
};

// ============= CREATE COMMENT =============
export async function createComment(prevState: State, formData: FormData) {
  const rawFields = {
    recruitId: formData.get("recruitId")?.toString() || "",
    brotherId: formData.get("brotherId")?.toString() || "",
    comment: formData.get("comment")?.toString() || "",
    redFlag: formData.get("redFlag")?.toString() || "",
  };

  const validatedFields = CommentSchema.safeParse(rawFields);
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Submit Comment.",
    };
  }

  const { recruitId, brotherId, comment, redFlag } = validatedFields.data;

  const commentExists = await getCommentByRecruitAndBrother(
    recruitId,
    brotherId
  );
  if (commentExists) {
    return {
      message: "Comment already exists. Please update instead.",
    };
  }

  const commentId = randomUUID();

  const finalRedFlag = redFlag || "None";
  try {
    await sql`
      INSERT INTO recruit_comments (id, recruit_id, brother_id, comment, red_flag)
      VALUES (
        ${commentId},
        ${recruitId},
        ${brotherId},
        ${comment || null},
        ${finalRedFlag}
      )
    `;
  } catch (error) {
    console.error("Database Error:", error);
    return {
      message: "Database Error: Failed to Submit Comment.",
    };
  }

  revalidatePath(`/recruits/${recruitId}/details`);
  redirect(`/recruits/${recruitId}/details`);
}

// ============= GET COMMENT BY RECRUIT AND BROTHER =============
export async function getCommentByRecruitAndBrother(
  recruitId: string,
  brotherId: string
) {
  try {
    const result = await sql`
      SELECT id, comment, red_flag 
      FROM recruit_comments 
      WHERE recruit_id = ${recruitId} AND brother_id = ${brotherId} 
      LIMIT 1
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching comment:", error);
    return null;
  }
}

// ============= UPSERT COMMENT =============
export async function upsertComment(prevState: State, formData: FormData) {
  const rawFields = {
    recruitId: formData.get("recruitId")?.toString() || "",
    brotherId: formData.get("brotherId")?.toString() || "",
    comment: formData.get("comment")?.toString() || "",
    redFlag: formData.get("redFlag")?.toString() || "",
    commentId: formData.get("commentId")?.toString() || "",
  };

  const validatedFields = CommentSchema.safeParse(rawFields);
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Submit Comment.",
    };
  }

  const { recruitId, brotherId, comment, redFlag } = validatedFields.data;
  const commentId = rawFields.commentId || randomUUID();
  const finalRedFlag = redFlag || "None";

  try {
    if (rawFields.commentId) {
      await sql`
        UPDATE recruit_comments 
        SET
          comment = ${comment || null},
          red_flag = ${finalRedFlag}
        WHERE id = ${commentId}
      `;
    } else {
      const commentExists = await getCommentByRecruitAndBrother(
        recruitId,
        brotherId
      );
      if (commentExists) {
        return {
          message: "Comment already exists. Please update instead.",
        };
      }

      await sql`
        INSERT INTO recruit_comments (id, recruit_id, brother_id, comment, red_flag)
        VALUES (
          ${commentId},
          ${recruitId},
          ${brotherId},
          ${comment || null},
          ${finalRedFlag}
        )
      `;
    }
  } catch (error) {
    console.error("Database Error:", error);
    return {
      message: "Database Error: Failed to Submit Comment.",
    };
  }

  revalidatePath(`/recruits/${recruitId}/details`);
  redirect(`/recruits/${recruitId}/details`);
}

// ============= CREATE BROTHER ACCOUNT =============
export async function createBrotherAccount(
  prevState: State,
  formData: FormData
) {
  // 1) Extract fields and normalize emails to lowercase
  const rawFields = {
    personal_email: formData.get("personal_email")?.toString().toLowerCase().trim() || "",
    school_email: formData.get("school_email")?.toString().toLowerCase().trim() || "",
    password: formData.get("password")?.toString() || "",
    first_name: formData.get("first_name")?.toString() || "",
    last_name: formData.get("last_name")?.toString() || "",
    year: formData.get("year")?.toString() || "",
    phone: formData.get("phone")?.toString() || "",
    house: formData.get("house")?.toString() || "",
    brother_name: formData.get("brother_name")?.toString() || "",
    birthday: formData.get("birthday")?.toString() || "",
    location: formData.get("location")?.toString() || "",
    tagline: formData.get("tagline")?.toString() || "",
    position: formData.get("position")?.toString() || "",
    bio: formData.get("bio")?.toString() || "",
    instagram: formData.get("instagram")?.toString() || "",
    image: formData.get("image") as File | null,
    invite_code: formData.get("invite_code")?.toString() || "",
  };

  // 2) Validate with Zod
  const parsed = BrotherSchema.safeParse(rawFields);
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Validation failed. Please check your inputs.",
    };
  }

  // 2a) Check invitation code if needed
  const userCode = rawFields.invite_code;
  if (!userCode || userCode !== process.env.SIGNUP_SECRET_CODE) {
    return { message: "Invalid invitation code." };
  }

  // 3) Validate image file extension
  const imageFile = parsed.data.image;
  if (imageFile) {
    const validationError = validateImageFile(imageFile);
    if (validationError) {
      return { message: validationError };
    }
  } else {
    return { message: "No image file was provided." };
  }

  // 4) Hash password
  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  // 5) Generate image variants and upload to Vercel Blob
  let uploadedImage: UploadedProfileImage;
  try {
    uploadedImage = await uploadProfileImageVariants(imageFile, "brother-profile");
  } catch (error) {
    console.error("Upload Error:", error);
    return { message: "Failed to upload profile photo." };
  }

  // 6) Insert into DB. If this fails the blobs we just wrote have nothing
  //    pointing at them, so remove them before returning.
  try {
    const brotherId = randomUUID();
    await sql`
      INSERT INTO brothers (
        id, 
        personal_email, 
        school_email,
        password,
        first_name,
        last_name,
        year,
        phone,
        house,
        brother_name,
        birthday,
        location,
        tagline,
        position,
        bio,
        instagram,
        image_url
      ) 
      VALUES (
        ${brotherId}, 
        ${parsed.data.personal_email}, 
        ${parsed.data.school_email}, 
        ${hashedPassword}, 
        ${parsed.data.first_name},
        ${parsed.data.last_name},
        ${parsed.data.year},
        ${parsed.data.phone},
        ${parsed.data.house},
        ${parsed.data.brother_name},
        ${parsed.data.birthday},
        ${parsed.data.location},
        ${parsed.data.tagline},
        ${parsed.data.position},
        ${parsed.data.bio},
        ${parsed.data.instagram},
        ${uploadedImage.serialized}
      )
    `;
  } catch (error) {
    console.error("Database Error:", error);
    await deleteImageUrls(uploadedImage.urls);
    return { message: "Failed to create brother account." };
  }

  // 7) Revalidate & redirect
  revalidatePath("/brothers");
  redirect("/brothers");
}

// ============= CREATE RECRUIT ACCOUNT =============
export async function createRecruitAccount(
  prevState: State,
  formData: FormData
) {
  const rawFields = {
    email: formData.get("email")?.toString().toLowerCase().trim() || "",
    first_name: formData.get("first_name")?.toString() || "",
    last_name: formData.get("last_name")?.toString() || "",
    year: formData.get("year")?.toString() || "",
    phone: formData.get("phone")?.toString() || "",
    room: formData.get("room")?.toString() || "",
    image: formData.get("image") as File | null,
  };
  const parsed = RecruitSchema.safeParse(rawFields);
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Validation failed. Please check your inputs.",
    };
  }

  const imageFile = parsed.data.image;
  if (imageFile) {
    const validationError = validateImageFile(imageFile);
    if (validationError) {
      return { message: validationError };
    }
  } else {
    return { message: "No image file was provided." };
  }

  // Generate image variants and upload
  let uploadedImage: UploadedProfileImage;
  try {
    uploadedImage = await uploadProfileImageVariants(imageFile, "recruit-profile");
  } catch (error) {
    console.error("Upload Error:", error);
    return { message: "Failed to upload profile photo." };
  }

  // Insert recruit. A duplicate email (23505) is an expected outcome here, so
  // the blobs we just uploaded have to be cleaned up on every failure path.
  try {
    const recruitId = randomUUID();
    await sql`
      INSERT INTO recruits (
        id, 
        email,
        first_name,
        last_name,
        year,
        phone,
        room,
        image_url
      ) 
      VALUES (
        ${recruitId}, 
        ${parsed.data.email},
        ${parsed.data.first_name},
        ${parsed.data.last_name},
        ${parsed.data.year},
        ${parsed.data.phone},
        ${parsed.data.room},
        ${uploadedImage.serialized}
      )
    `;
  } catch (error: unknown) {
    console.error("Recruit DB Error:", error);
    await deleteImageUrls(uploadedImage.urls);

    if (error instanceof Error && "code" in error && error.code === "23505") {
      return {
        message: "An account with this email already exists.",
      };
    }

    return {
      message: "Failed to create recruit account. Please try again later.",
    };
  }

  revalidatePath("/");
  redirect("/");
}

/** Profile fields a brother can edit, in the shape the form submits them. */
const EDITABLE_PROFILE_FIELDS = [
  "first_name",
  "last_name",
  "personal_email",
  "school_email",
  "year",
  "phone",
  "house",
  "brother_name",
  "birthday",
  "location",
  "tagline",
  "position",
  "bio",
  "instagram",
] as const;

/**
 * Whether a submitted profile differs from what's stored.
 *
 * Both sides are compared as trimmed strings: the form sends everything as
 * text, while the database hands back numbers for `year` and NULL for an
 * empty `instagram`.
 */
function hasProfileChanges(
  submitted: Record<string, unknown>,
  stored: Record<string, unknown>
): boolean {
  const normalize = (value: unknown) =>
    value === null || value === undefined ? "" : String(value).trim();

  return EDITABLE_PROFILE_FIELDS.some((field) => {
    const submittedValue = normalize(submitted[field]);
    const storedValue = normalize(stored[field]);
    // Emails are lowercased on the way in, so compare them case-insensitively
    if (field === "personal_email" || field === "school_email") {
      return submittedValue.toLowerCase() !== storedValue.toLowerCase();
    }
    return submittedValue !== storedValue;
  });
}

export async function updateBrotherProfile(
  prevState: State,
  formData: FormData
) {
  // ✅ Extract form data, ensuring `null` is handled for image and emails are normalized
  const rawFields = {
    brotherId: formData.get("brotherId")?.toString() || "",
    first_name: formData.get("first_name")?.toString() || "",
    last_name: formData.get("last_name")?.toString() || "",
    personal_email: formData.get("personal_email")?.toString().toLowerCase().trim() || "",
    school_email: formData.get("school_email")?.toString().toLowerCase().trim() || "",
    year: formData.get("year")?.toString() || "",
    phone: formData.get("phone")?.toString() || "",
    house: formData.get("house")?.toString() || "",
    brother_name: formData.get("brother_name")?.toString() || "",
    birthday: formData.get("birthday")?.toString() || "",
    location: formData.get("location")?.toString() || "",
    tagline: formData.get("tagline")?.toString() || "",
    position: formData.get("position")?.toString() || "",
    bio: formData.get("bio")?.toString() || "",
    instagram: formData.get("instagram")?.toString() || "",
    image: (() => {
      const file = formData.get("image");
      // An untouched file input still submits a File — empty, and named ""
      // in most browsers or "undefined" in some. Either way there is no
      // upload, so don't run it through the image validation.
      if (file instanceof File && (file.size === 0 || !file.name || file.name === "undefined")) {
        return null; // Treat as no file uploaded
      }
      return file; // Otherwise, return the file
    })(),
  };

  // ✅ Validate with Zod
  const parsed = EditBrotherSchema.safeParse(rawFields);
  if (!parsed.success) {
    console.error("Validation Errors:", parsed.error.flatten().fieldErrors); // ✅ Debugging validation issues
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Validation failed.",
    };
  }

  const imageFile = parsed.data.image;

  // ✅ Load the row once — used to spot a no-op submit and to reuse/replace images
  let existingRow: Record<string, unknown>;
  try {
    const existing = await sql`
      SELECT first_name, last_name, personal_email, school_email, year, phone,
             house, brother_name, TO_CHAR(birthday, 'YYYY-MM-DD') AS birthday,
             location, tagline, position, bio, instagram, image_url
      FROM brothers
      WHERE id = ${parsed.data.brotherId}
    `;
    if (existing.rows.length === 0) {
      return { message: "Profile not found." };
    }
    existingRow = existing.rows[0];
  } catch (error) {
    console.error("Error fetching existing brother:", error);
    // Without the current row the UPDATE below would blank out image_url.
    return { message: "Database Error: Failed to load current profile." };
  }

  // ✅ Nothing to save: no new photo and every field matches what's stored.
  // Say so plainly instead of failing validation on an untouched form.
  if (!imageFile && !hasProfileChanges(parsed.data, existingRow)) {
    return { message: "No changes to save. Update a field first." };
  }

  const currentImageUrl = (existingRow.image_url as string | null) ?? null;
  let newImageUrl: string | null = currentImageUrl;
  let uploadedImage: UploadedProfileImage | null = null;
  let supersededImageUrls: string[] = [];

  if (imageFile) {
    try {
      uploadedImage = await uploadProfileImageVariants(imageFile, "brother-profile");
    } catch (error) {
      console.error("Image Upload Error:", error);
      return { message: "Failed to upload new photo." };
    }
    newImageUrl = uploadedImage.serialized;
    // Never delete a URL the new image also uses.
    supersededImageUrls = extractImageUrls(currentImageUrl).filter(
      (url) => !uploadedImage!.urls.includes(url)
    );
  }

  // ✅ Update the database
  try {
    await sql`
      UPDATE brothers
      SET
        first_name = ${parsed.data.first_name},
        last_name = ${parsed.data.last_name},
        personal_email = ${parsed.data.personal_email},
        school_email = ${parsed.data.school_email},
        year = ${parsed.data.year},
        phone = ${parsed.data.phone},
        house = ${parsed.data.house},
        brother_name = ${parsed.data.brother_name},
        birthday = ${parsed.data.birthday},
        location = ${parsed.data.location},
        tagline = ${parsed.data.tagline},
        position = ${parsed.data.position},
        bio = ${parsed.data.bio},
        instagram = ${parsed.data.instagram || null},
        image_url = ${newImageUrl} -- ✅ Keeps old image if no new one is uploaded
      WHERE id = ${parsed.data.brotherId}
    `;
  } catch (error) {
    console.error("DB Error:", error);
    // The row still points at the old image, so discard what we just uploaded.
    if (uploadedImage) {
      await deleteImageUrls(uploadedImage.urls);
    }
    return { message: "Database Error: Failed to update profile." };
  }

  // The new URL is committed, so the previous variants are now unreferenced.
  // Awaited on purpose -- a detached promise can be killed when the serverless
  // function freezes after the response, which is what orphaned them before.
  if (supersededImageUrls.length > 0) {
    await deleteImageUrls(supersededImageUrls);
  }

  // ✅ Revalidate and Redirect
  revalidatePath("/brothers");
  redirect("/brothers");
}

// ============= PASSWORD RESET ACTIONS =============

export type PasswordResetState = {
  message: string;
};

export type ResetPasswordState = {
  message: string;
  success?: boolean;
};

export async function requestPasswordReset(
  prevState: PasswordResetState | undefined,
  formData: FormData
): Promise<PasswordResetState> {
  const email = formData.get("email")?.toString() || "";

  // Validate email format
  const emailSchema = z.string().email();
  const validatedEmail = emailSchema.safeParse(email);

  if (!validatedEmail.success) {
    return {
      message: "Please enter a valid email address.",
    };
  }

  // Normalize email to lowercase for case-insensitive comparison
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if user exists
    const brother = await sql`
      SELECT id, personal_email, first_name
      FROM brothers
      WHERE personal_email = ${normalizedEmail}
      LIMIT 1;
    `;

    // Always show success message for security (don't reveal if email exists)
    if (brother.rows.length === 0) {
      return {
        message:
          "If an account exists with this email, you will receive a password reset link.",
      };
    }

    // Generate secure random token
    const crypto = await import("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Set expiration time (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Store token in database
    await sql`
      UPDATE brothers
      SET reset_token = ${resetToken},
          reset_token_expires = ${expiresAt.toISOString()}
      WHERE personal_email = ${normalizedEmail}
    `;

    // Send email (use the original email from the database for proper casing in the email)
    const { sendPasswordResetEmail } = await import("@/app/lib/email");
    const emailResult = await sendPasswordResetEmail(brother.rows[0].personal_email, resetToken);

    if (!emailResult.success) {
      console.error("Failed to send reset email:", emailResult.error);
      // Don't expose email sending failure to user for security
    }

    return {
      message:
        "If an account exists with this email, you will receive a password reset link.",
    };
  } catch (error) {
    console.error("Password reset request error:", error);
    return {
      message:
        "If an account exists with this email, you will receive a password reset link.",
    };
  }
}

export async function verifyResetToken(token: string) {
  try {
    const { fetchBrotherByResetToken } = await import("@/app/lib/data");
    const brother = await fetchBrotherByResetToken(token);

    if (!brother) {
      return { valid: false };
    }

    return { valid: true };
  } catch (error) {
    console.error("Error verifying reset token:", error);
    return { valid: false };
  }
}

export async function resetPassword(
  prevState: ResetPasswordState | undefined,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = formData.get("token")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  const confirmPassword = formData.get("confirmPassword")?.toString() || "";

  // Validate inputs
  if (!token) {
    return { message: "Invalid or missing reset token." };
  }

  if (!password || password.length < 6) {
    return { message: "Password must be at least 6 characters long." };
  }

  if (password !== confirmPassword) {
    return { message: "Passwords do not match." };
  }

  try {
    // Verify token and get brother
    const { fetchBrotherByResetToken } = await import("@/app/lib/data");
    const brother = await fetchBrotherByResetToken(token);

    if (!brother) {
      return {
        message: "Invalid or expired reset token. Please request a new one.",
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await sql`
      UPDATE brothers
      SET password = ${hashedPassword},
          reset_token = NULL,
          reset_token_expires = NULL
      WHERE id = ${brother.id}
    `;

    return {
      message: "Password reset successful! You can now log in with your new password.",
      success: true,
    };
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      message: "Failed to reset password. Please try again.",
    };
  }
}
