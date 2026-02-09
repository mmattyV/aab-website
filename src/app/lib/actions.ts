"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { BrotherSchema, RecruitSchema, EditBrotherSchema } from "./zod-schemas";
import bcrypt from "bcrypt";
import { validateImageFile } from "@/app/utils/validateImage";
import { sanitizeFilename } from "@/app/utils/sanitizeFilename";

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
  // 1) Extract fields
  const rawFields = {
    personal_email: formData.get("personal_email")?.toString() || "",
    school_email: formData.get("school_email")?.toString() || "",
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

  // 5) Upload image to Vercel Blob
  try {
    const fileBuffer = Buffer.from(await imageFile.arrayBuffer());
    const sanitizedFilename = sanitizeFilename(imageFile.name);
    const fileName = `brother-profile-${randomUUID()}-${sanitizedFilename}`;
    const { url } = await put(fileName, fileBuffer, {
      access: "public",
      contentType: imageFile.type,
    });

    // 6) Insert into DB
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
        ${url}
      )
    `;
  } catch (error) {
    console.error("Database or Upload Error:", error);
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
    email: formData.get("email")?.toString() || "",
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

  try {
    // Upload image directly without conversion
    const fileBuffer = Buffer.from(await imageFile.arrayBuffer());
    const sanitizedFilename = sanitizeFilename(imageFile.name);
    const fileName = `brother-profile-${randomUUID()}-${sanitizedFilename}`;
    const { url } = await put(fileName, fileBuffer, {
      access: "public",
      contentType: imageFile.type,
    });

    // Insert recruit
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
        ${url}
      )
    `;
  } catch (error: unknown) {
    console.error("Recruit DB Error:", error);

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

export async function updateBrotherProfile(
  prevState: State,
  formData: FormData
) {
  // ✅ Extract form data, ensuring `null` is handled for image
  const rawFields = {
    brotherId: formData.get("brotherId")?.toString() || "",
    first_name: formData.get("first_name")?.toString() || "",
    last_name: formData.get("last_name")?.toString() || "",
    personal_email: formData.get("personal_email")?.toString() || "",
    school_email: formData.get("school_email")?.toString() || "",
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
      // Check if the file is invalid (name: "undefined", type: "application/octet-stream", size: 0)
      if (
        file instanceof File &&
        file.name === "undefined" &&
        file.type === "application/octet-stream" &&
        file.size === 0
      ) {
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

  let newImageUrl: string | undefined;
  const imageFile = parsed.data.image;

  if (imageFile) {
    // ✅ Upload new image
    try {
      const fileBuffer = Buffer.from(await imageFile.arrayBuffer());
      const sanitizedFilename = sanitizeFilename(imageFile.name);
      const fileName = `brother-profile-${randomUUID()}-${sanitizedFilename}`;
      const { url } = await put(fileName, fileBuffer, {
        access: "public",
        contentType: imageFile.type,
      });
      newImageUrl = url;
    } catch (error) {
      console.error("Image Upload Error:", error);
      return { message: "Failed to upload new photo." };
    }
  } else {
    // ✅ If no new image is uploaded, keep the existing one
    const existingBrother =
      await sql`SELECT image_url FROM brothers WHERE id = ${parsed.data.brotherId}`;
    if (existingBrother.rows.length > 0) {
      newImageUrl = existingBrother.rows[0].image_url; // Preserve current image
    }
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
    return { message: "Database Error: Failed to update profile." };
  }

  // ✅ Revalidate and Redirect
  revalidatePath("/brothers");
  redirect("/brothers");
}

// ============= PASSWORD RESET ACTIONS =============

export async function requestPasswordReset(
  prevState: State,
  formData: FormData
) {
  const email = formData.get("email")?.toString() || "";

  // Validate email format
  const emailSchema = z.string().email();
  const validatedEmail = emailSchema.safeParse(email);

  if (!validatedEmail.success) {
    return {
      message: "Please enter a valid email address.",
    };
  }

  try {
    // Check if user exists
    const brother = await sql`
      SELECT id, personal_email, first_name
      FROM brothers
      WHERE personal_email = ${email}
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
      WHERE personal_email = ${email}
    `;

    // Send email
    const { sendPasswordResetEmail } = await import("@/app/lib/email");
    const emailResult = await sendPasswordResetEmail(email, resetToken);

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

export async function resetPassword(prevState: State, formData: FormData) {
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
