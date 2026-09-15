"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { z } from "zod";
import { sql, db } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import {
  BrotherSchema,
  RecruitSchema,
  EditBrotherSchema,
  EditRecruitSchema,
} from "./zod-schemas";
import bcrypt from "bcrypt";
import { validateImageFile } from "@/app/utils/validateImage";
import {
  uploadProfileImageVariants,
  deleteImageUrls,
  extractImageUrls,
  type UploadedProfileImage,
} from "@/app/lib/blob-images";
import { getSessionBrother, getRecruitsAccess } from "@/app/lib/board-access";
import { writeRecruitsEnabled } from "@/app/lib/site-flags";
import { isAssignablePosition } from "@/app/lib/positions";
import type {
  DashboardSelection,
  DeleteProfilesResult,
} from "@/app/lib/definitions";

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

/**
 * Check that the signed-in brother may write this comment.
 *
 * `brotherId` arrives in the form body, so it is treated as a claim rather
 * than a fact: a comment can only ever be written as yourself, and only while
 * you can reach the recruits section at all.
 *
 * @returns the author's id, or the `State` to hand straight back to the form
 */
async function requireCommentAuthor(
  claimedBrotherId: string
): Promise<{ brotherId: string } | State> {
  const access = await getRecruitsAccess();

  if (access.status === "signed-out") {
    return { message: "You must be signed in to comment." };
  }
  if (access.status === "closed") {
    return { message: "Recruits are closed right now." };
  }
  if (access.brother.id !== claimedBrotherId) {
    return { message: "You can only comment as yourself." };
  }

  return { brotherId: access.brother.id };
}

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

  const author = await requireCommentAuthor(validatedFields.data.brotherId);
  if ("message" in author) return author;

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

  const author = await requireCommentAuthor(validatedFields.data.brotherId);
  if ("message" in author) return author;

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
 * Whether any of `fields` differs between a submitted form and the stored row.
 *
 * Both sides are compared as trimmed strings: a form sends everything as
 * text, while the database hands back numbers for `year` and NULL for an
 * empty `instagram`.
 */
function hasFieldChanges(
  fields: readonly string[],
  submitted: Record<string, unknown>,
  stored: Record<string, unknown>
): boolean {
  const normalize = (value: unknown) =>
    value === null || value === undefined ? "" : String(value).trim();

  return fields.some((field) => {
    const submittedValue = normalize(submitted[field]);
    const storedValue = normalize(stored[field]);
    // Emails are lowercased on the way in, so compare them case-insensitively
    if (field.endsWith("email")) {
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

  // ✅ Dashboard edits return to the dashboard, a brother editing their own
  // profile returns to /brothers. Only those two destinations exist, so a
  // tampered field can't turn this into an open redirect.
  const returnsToDashboard =
    formData.get("returnTo")?.toString() === "dashboard";

  // ✅ Validate with Zod
  const parsed = EditBrotherSchema.safeParse(rawFields);
  if (!parsed.success) {
    console.error("Validation Errors:", parsed.error.flatten().fieldErrors); // ✅ Debugging validation issues
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Validation failed.",
    };
  }

  // ✅ You may edit your own profile; editing anyone else's is a board action.
  // Re-checked here so a hand-rolled request can't skip the dashboard's gate.
  const actor = await getSessionBrother();
  if (!actor) {
    return { message: "You must be signed in to edit a profile." };
  }
  const isSelf = actor.id === parsed.data.brotherId;
  if (!isSelf && !actor.isBoardMember) {
    return { message: "You are not allowed to edit this profile." };
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

  // ✅ Positions are a board privilege, and only the known list is assignable —
  // a profile may keep a legacy position, but nobody can invent a new one.
  const storedPosition = (existingRow.position as string | null) ?? "";
  if (parsed.data.position !== storedPosition) {
    if (!actor.isBoardMember) {
      return { message: "Only board members can change a position." };
    }
    if (!isAssignablePosition(parsed.data.position, storedPosition)) {
      return { message: "That is not a valid position." };
    }
  }

  // ✅ Nothing to save: no new photo and every field matches what's stored.
  // Say so plainly instead of failing validation on an untouched form.
  if (
    !imageFile &&
    !hasFieldChanges(EDITABLE_PROFILE_FIELDS, parsed.data, existingRow)
  ) {
    return { message: "No changes to save. Update a field first." };
  }

  let newImageUrl: string | null = (existingRow.image_url as string | null) ?? null;
  let uploadedImage: UploadedProfileImage | null = null;

  if (imageFile) {
    try {
      uploadedImage = await uploadProfileImageVariants(imageFile, "brother-profile");
    } catch (error) {
      console.error("Image Upload Error:", error);
      return { message: "Failed to upload new photo." };
    }
    newImageUrl = uploadedImage.serialized;
  }

  // ✅ Update the database
  //
  // The image_url being replaced is read back from this statement rather than
  // from the SELECT above. `FOR UPDATE` serializes concurrent edits of the same
  // profile, so each request sees the value it actually superseded: without it,
  // two simultaneous edits both read the original URL, both delete it, and the
  // losing request's upload is left in storage with nothing referencing it.
  let supersededImageUrls: string[] = [];
  try {
    const updated = await sql`
      UPDATE brothers AS b
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
      FROM (
        SELECT image_url AS old_url
        FROM brothers
        WHERE id = ${parsed.data.brotherId}
        FOR UPDATE
      ) AS prev
      WHERE b.id = ${parsed.data.brotherId}
      RETURNING prev.old_url
    `;

    if (updated.rows.length === 0) {
      // Row disappeared between the read and the write.
      if (uploadedImage) {
        await deleteImageUrls(uploadedImage.urls);
      }
      return { message: "Profile not found." };
    }

    if (uploadedImage) {
      const replacedUrl = updated.rows[0].old_url as string | null;
      // Never delete a URL the new image also uses.
      supersededImageUrls = extractImageUrls(replacedUrl).filter(
        (url) => !uploadedImage!.urls.includes(url)
      );
    }
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
  if (!isSelf || returnsToDashboard) {
    revalidatePath("/dashboard");
  }
  redirect(returnsToDashboard ? "/dashboard" : "/brothers");
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

// ============= RECRUIT MANAGEMENT =============

/** Recruit fields the dashboard form submits, in the order they appear. */
const EDITABLE_RECRUIT_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "year",
  "phone",
  "room",
] as const;

/**
 * Edit any recruit from the dashboard.
 *
 * Unlike a brother profile there is no self-service version of this form —
 * recruits don't have accounts — so board membership is required outright.
 */
export async function updateRecruitProfile(
  prevState: State,
  formData: FormData
) {
  const rawFields = {
    recruitId: formData.get("recruitId")?.toString() || "",
    first_name: formData.get("first_name")?.toString() || "",
    last_name: formData.get("last_name")?.toString() || "",
    email: formData.get("email")?.toString().toLowerCase().trim() || "",
    year: formData.get("year")?.toString() || "",
    phone: formData.get("phone")?.toString() || "",
    room: formData.get("room")?.toString() || "",
    image: (() => {
      const file = formData.get("image");
      // An untouched file input still submits an empty File — not an upload.
      if (
        file instanceof File &&
        (file.size === 0 || !file.name || file.name === "undefined")
      ) {
        return null;
      }
      return file;
    })(),
  };

  const parsed = EditRecruitSchema.safeParse(rawFields);
  if (!parsed.success) {
    console.error("Validation Errors:", parsed.error.flatten().fieldErrors);
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Validation failed.",
    };
  }

  // Re-checked here so a hand-rolled request can't skip the dashboard's gate.
  const actor = await getSessionBrother();
  if (!actor) {
    return { message: "You must be signed in to edit a recruit." };
  }
  if (!actor.isBoardMember) {
    return { message: "You are not allowed to edit recruits." };
  }

  let existingRow: Record<string, unknown> | undefined;
  try {
    const existing = await sql`
      SELECT first_name, last_name, email, year, phone, room, image_url
      FROM recruits
      WHERE id = ${parsed.data.recruitId}
    `;
    existingRow = existing.rows[0];
  } catch (error) {
    console.error("Error fetching existing recruit:", error);
  }

  if (!existingRow) {
    return { message: "Could not load this recruit. Please try again." };
  }

  const imageFile = parsed.data.image;

  // Nothing to save: no new photo and every field matches what's stored.
  if (
    !imageFile &&
    !hasFieldChanges(EDITABLE_RECRUIT_FIELDS, parsed.data, existingRow)
  ) {
    return { message: "No changes to save. Update a field first." };
  }

  let newImageUrl: string | null = (existingRow.image_url as string | null) ?? null;
  let uploadedImage: UploadedProfileImage | null = null;

  if (imageFile) {
    try {
      uploadedImage = await uploadProfileImageVariants(imageFile, "recruit-profile");
    } catch (error) {
      console.error("Image Upload Error:", error);
      return { message: "Failed to upload new photo." };
    }
    newImageUrl = uploadedImage.serialized;
  }

  // Mirrors updateBrotherProfile: the replaced image_url is read back from the
  // UPDATE under FOR UPDATE, so two simultaneous edits can't both delete the
  // same old URL and orphan the loser's upload.
  let supersededImageUrls: string[] = [];
  try {
    const updated = await sql`
      UPDATE recruits AS r
      SET
        first_name = ${parsed.data.first_name},
        last_name = ${parsed.data.last_name},
        email = ${parsed.data.email},
        year = ${parsed.data.year},
        phone = ${parsed.data.phone},
        room = ${parsed.data.room},
        image_url = ${newImageUrl}
      FROM (
        SELECT image_url AS old_url
        FROM recruits
        WHERE id = ${parsed.data.recruitId}
        FOR UPDATE
      ) AS prev
      WHERE r.id = ${parsed.data.recruitId}
      RETURNING prev.old_url
    `;

    if (updated.rows.length === 0) {
      // Row disappeared between the read and the write.
      if (uploadedImage) {
        await deleteImageUrls(uploadedImage.urls);
      }
      return { message: "Recruit not found." };
    }

    if (uploadedImage) {
      const replacedUrl = updated.rows[0].old_url as string | null;
      // Never delete a URL the new image also uses.
      supersededImageUrls = extractImageUrls(replacedUrl).filter(
        (url) => !uploadedImage!.urls.includes(url)
      );
    }
  } catch (error: unknown) {
    console.error("DB Error:", error);
    // The row still points at the old image, so discard what we just uploaded.
    if (uploadedImage) {
      await deleteImageUrls(uploadedImage.urls);
    }

    if (error instanceof Error && "code" in error && error.code === "23505") {
      return { message: "Another recruit already uses this email." };
    }

    return { message: "Database Error: Failed to update recruit." };
  }

  // The new URL is committed, so the previous variants are now unreferenced.
  if (supersededImageUrls.length > 0) {
    await deleteImageUrls(supersededImageUrls);
  }

  revalidatePath("/recruits");
  revalidatePath(`/recruits/${parsed.data.recruitId}/details`);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// ============= PROFILE DELETION =============

/**
 * Profiles picked for deletion.
 *
 * Ids are parsed as UUIDs so a malformed value is rejected before it reaches
 * a query, and the two lists stay separate so no id is ever applied to the
 * wrong table.
 */
const DeleteSelectionSchema = z.object({
  brotherIds: z.array(z.string().uuid()).default([]),
  recruitIds: z.array(z.string().uuid()).default([]),
});

/** "1 brother and 2 recruits", for the message the dashboard shows afterwards. */
function describeCounts(brotherCount: number, recruitCount: number): string {
  const parts: string[] = [];
  if (brotherCount > 0) {
    parts.push(`${brotherCount} brother${brotherCount === 1 ? "" : "s"}`);
  }
  if (recruitCount > 0) {
    parts.push(`${recruitCount} recruit${recruitCount === 1 ? "" : "s"}`);
  }
  return parts.join(" and ");
}

/**
 * Delete any mix of brother and recruit profiles.
 *
 * Backs both the per-row delete and the bulk delete so the two can't drift
 * apart. Profiles and the recruit comments that reference them go in one
 * transaction; the blob images follow once that has committed, since a failed
 * image delete shouldn't undo a successful one.
 */
export async function deleteProfiles(
  selection: DashboardSelection
): Promise<DeleteProfilesResult> {
  const failure = (message: string): DeleteProfilesResult => ({
    status: "error",
    message,
    deletedBrotherIds: [],
    deletedRecruitIds: [],
  });

  const actor = await getSessionBrother();
  if (!actor) {
    return failure("You must be signed in to delete profiles.");
  }
  if (!actor.isBoardMember) {
    return failure("You are not allowed to delete profiles.");
  }

  const parsed = DeleteSelectionSchema.safeParse(selection);
  if (!parsed.success) {
    return failure("Invalid selection. Reload the dashboard and try again.");
  }

  const brotherIds = Array.from(new Set(parsed.data.brotherIds));
  const recruitIds = Array.from(new Set(parsed.data.recruitIds));

  if (brotherIds.length === 0 && recruitIds.length === 0) {
    return failure("Select at least one profile to delete.");
  }

  // Reject the whole request rather than quietly deleting everyone else:
  // a request that includes you is a mistake worth seeing.
  if (brotherIds.includes(actor.id)) {
    return failure("You can't delete your own account.");
  }

  const deletedBrothers: { id: string; image_url: string | null }[] = [];
  const deletedRecruits: { id: string; image_url: string | null }[] = [];

  const client = await db.connect();
  try {
    await client.sql`BEGIN`;

    // Comments reference both tables, so they go first either way.
    await client.query(
      `DELETE FROM recruit_comments
       WHERE recruit_id = ANY($1::uuid[]) OR brother_id = ANY($2::uuid[])`,
      [recruitIds, brotherIds]
    );

    if (recruitIds.length > 0) {
      const result = await client.query<{ id: string; image_url: string | null }>(
        `DELETE FROM recruits WHERE id = ANY($1::uuid[])
         RETURNING id, image_url`,
        [recruitIds]
      );
      deletedRecruits.push(...result.rows);
    }

    if (brotherIds.length > 0) {
      const result = await client.query<{ id: string; image_url: string | null }>(
        `DELETE FROM brothers WHERE id = ANY($1::uuid[])
         RETURNING id, image_url`,
        [brotherIds]
      );
      deletedBrothers.push(...result.rows);
    }

    await client.sql`COMMIT`;
  } catch (error) {
    console.error("Database Error: Failed to delete profiles.", error);
    try {
      await client.sql`ROLLBACK`;
    } catch (rollbackError) {
      console.error("Failed to roll back deletion:", rollbackError);
    }
    return failure("Database Error: Failed to delete the selected profiles.");
  } finally {
    client.release();
  }

  // The rows are gone; clean up their pictures. Awaited rather than detached
  // so the serverless function can't freeze before the deletes finish, which
  // is what orphaned blobs before; failures are logged, never fatal.
  await deleteImageUrls(
    [...deletedBrothers, ...deletedRecruits].flatMap((row) =>
      extractImageUrls(row.image_url)
    )
  );

  const summary = describeCounts(deletedBrothers.length, deletedRecruits.length);

  revalidatePath("/dashboard");
  revalidatePath("/brothers");
  revalidatePath("/recruits");

  return {
    status: "success",
    message: summary
      ? `Deleted ${summary}.`
      : "Those profiles were already deleted.",
    deletedBrotherIds: deletedBrothers.map((row) => row.id),
    deletedRecruitIds: deletedRecruits.map((row) => row.id),
  };
}


// ============= SITE SWITCHES =============

export type SiteFlagState = {
  status: "success" | "error";
  message: string;
};

/**
 * Open or close the recruits section for brothers who aren't on the board.
 *
 * Board access is re-checked here, so the switch can't be flipped by anyone
 * who merely knows the action exists.
 */
export async function setRecruitsEnabled(
  enabled: boolean
): Promise<SiteFlagState> {
  const actor = await getSessionBrother();
  if (!actor) {
    return { status: "error", message: "You must be signed in." };
  }
  if (!actor.isBoardMember) {
    return {
      status: "error",
      message: "Only board members can change this setting.",
    };
  }

  const written = await writeRecruitsEnabled(enabled, actor.id);
  if (!written) {
    return {
      status: "error",
      message: "Could not save the setting. Please try again.",
    };
  }

  // The recruits link and pages are rendered from this flag everywhere.
  revalidatePath("/", "layout");

  return {
    status: "success",
    message: enabled
      ? "Recruits are open to all brothers."
      : "Recruits are now board-only.",
  };
}
