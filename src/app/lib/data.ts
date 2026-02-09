import {
  BrotherOverviewField,
  RecruitOverviewField,
  RecruitCommentProps,
  RecruitProfileProps,
} from "./definitions";
import { sql } from "@vercel/postgres";
import { BrotherProfileProps } from "@/app/lib/definitions";

export async function fetchAllBrothers() {
  try {
    const brothers = await sql<BrotherOverviewField>`
            SELECT id, first_name, last_name, house, position, year, image_url 
            FROM brothers
            ORDER BY year ASC, last_name ASC
        `;

    return brothers.rows;
  } catch (error) {
    console.error("Error fetching brothers", error);
    throw new Error("Failed to fetch all brothers.");
  }
}

export async function fetchBrotherById(
  id: string
): Promise<BrotherProfileProps | null> {
  if (!id) {
    console.error("Error: Missing ID for fetchBrotherById");
    throw new Error("Brother ID is required.");
  }

  try {
    const brother = await sql<BrotherProfileProps>`
      SELECT first_name,
             last_name,
             personal_email,
             school_email,
             brother_name,
             house,
             year,
             birthday,
             location,
             phone,
             tagline,
             position,
             bio,
             instagram,
             image_url
      FROM brothers
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (brother.rows.length === 0) {
      console.warn(`Warning: No brother found with ID ${id}`);
      return null; // ✅ Return `null` instead of throwing an error if no match is found
    }

    return brother.rows[0]; // ✅ Return the first row
  } catch (error) {
    console.error("❌ Error fetching brother by id:", error);
    throw new Error("Failed to fetch brother by id.");
  }
}

export async function fetchAllRecruits() {
  try {
    const recruits = await sql<RecruitOverviewField>`
            SELECT id, first_name, last_name, room, year, image_url 
            FROM recruits
            ORDER BY year ASC, last_name ASC
        `;

    return recruits.rows;
  } catch (error) {
    console.error("Error fetching recruits", error);
    throw new Error("Failed to fetch all recruits.");
  }
}

export async function fetchRecruitById(
  id: string
): Promise<RecruitProfileProps | null> {
  if (!id) {
    console.error("Error: Missing ID for fetchRecruitById");
    throw new Error("Recruit ID is required.");
  }

  try {
    const recruit = await sql<RecruitProfileProps>`
      SELECT first_name,
             last_name,
             email,
             phone,
             year,
             room,
             image_url
      FROM recruits
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (recruit.rows.length === 0) {
      console.warn(`Warning: No recruit found with ID ${id}`);
      return null; // ✅ Return `null` instead of throwing an error if no match is found
    }

    return recruit.rows[0]; // ✅ Return the first row
  } catch (error) {
    console.error("❌ Error fetching recruit by id:", error);
    throw new Error("Failed to fetch recruit by id.");
  }
}

export async function fetchAllComments() {
  try {
    const comments = await sql<RecruitCommentProps>`
            SELECT recruit_id, brother_id, comment, red_flag 
            FROM recruit_comments
            ORDER BY brother_id ASC
        `;

    return comments.rows;
  } catch (error) {
    console.error("Error fetching recruit comments", error);
    throw new Error("Failed to fetch all recruit comments.");
  }
}

export async function fetchBrotherByEmail(email: string) {
  try {
    const brother = await sql`
      SELECT id, first_name, last_name, personal_email
      FROM brothers
      WHERE personal_email = ${email}
      LIMIT 1;
    `;

    return brother.rows[0] || null;
  } catch (error) {
    console.error("❌ Error fetching brother by email:", error);
    return null;
  }
}

export async function fetchUserCommentForRecruit(recruitId: string, userId: string) {
  try {
    const result = await sql`
      SELECT id, comment, red_flag 
      FROM recruit_comments 
      WHERE recruit_id = ${recruitId} AND brother_id = ${userId}
      LIMIT 1
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching user comment:", error);
    return null;
  }
}

export async function fetchBrotherByResetToken(token: string) {
  try {
    const brother = await sql`
      SELECT id, personal_email, reset_token_expires
      FROM brothers
      WHERE reset_token = ${token}
      LIMIT 1;
    `;

    if (brother.rows.length === 0) {
      return null;
    }

    const result = brother.rows[0];
    
    // Check if token has expired
    if (result.reset_token_expires && new Date(result.reset_token_expires) < new Date()) {
      return null; // Token has expired
    }

    return result;
  } catch (error) {
    console.error("❌ Error fetching brother by reset token:", error);
    return null;
  }
}