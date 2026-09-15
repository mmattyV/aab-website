import { sql } from "@vercel/postgres";

/**
 * Site-wide on/off switches, stored in the `site_flags` table so a board
 * member can change them without a deploy.
 *
 * Reads never throw: a flag that can't be loaded falls back to its default,
 * which is always the behaviour the site had before flags existed. That keeps
 * the app working on an environment where the migration hasn't run yet.
 */

/** Whether brothers who aren't on the board can reach the recruits section. */
export const RECRUITS_ENABLED_FLAG = "recruits_enabled";

/** Recruits are open unless somebody has deliberately closed them. */
const RECRUITS_ENABLED_DEFAULT = true;

/** Postgres `undefined_table` — the migration hasn't been run here yet. */
const UNDEFINED_TABLE = "42P01";

function isMissingTable(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: string }).code === UNDEFINED_TABLE
  );
}

export type RecruitsFlag = {
  enabled: boolean;
  /** ISO timestamp, already normalized so it crosses to a client component. */
  updatedAt: string | null;
  /** Name of the brother who last flipped it, when still known. */
  updatedBy: string | null;
};

/** The recruits switch plus who last touched it, for the dashboard. */
export async function fetchRecruitsFlag(): Promise<RecruitsFlag> {
  try {
    const result = await sql<{
      value: boolean;
      updated_at: string | Date | null;
      updated_by_name: string | null;
    }>`
      SELECT f.value,
             f.updated_at,
             NULLIF(TRIM(b.first_name || ' ' || b.last_name), '') AS updated_by_name
      FROM site_flags AS f
      LEFT JOIN brothers AS b ON b.id = f.updated_by
      WHERE f.key = ${RECRUITS_ENABLED_FLAG}
      LIMIT 1;
    `;

    const row = result.rows[0];
    if (!row) {
      return { enabled: RECRUITS_ENABLED_DEFAULT, updatedAt: null, updatedBy: null };
    }

    return {
      enabled: row.value,
      // Normalized here rather than at the call site: the driver hands back a
      // Date, which a client component can't receive.
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
      updatedBy: row.updated_by_name,
    };
  } catch (error) {
    if (isMissingTable(error)) {
      console.warn(
        "site_flags table is missing — run `pnpm migrate:site-flags`. Falling back to defaults."
      );
    } else {
      console.error("❌ Error reading the recruits flag:", error);
    }
    return { enabled: RECRUITS_ENABLED_DEFAULT, updatedAt: null, updatedBy: null };
  }
}

/**
 * Just the switch, for the many places that only need to gate on it.
 *
 * Falls back to open, so a database hiccup never locks brothers out of a
 * section they could reach a moment earlier.
 */
export async function fetchRecruitsEnabled(): Promise<boolean> {
  return (await fetchRecruitsFlag()).enabled;
}

/**
 * Flip the recruits switch. Callers are responsible for checking that the
 * brother is allowed to; this only writes.
 *
 * @returns false when the write failed, so the caller can say so
 */
export async function writeRecruitsEnabled(
  enabled: boolean,
  brotherId: string
): Promise<boolean> {
  try {
    await sql`
      INSERT INTO site_flags (key, value, updated_at, updated_by)
      VALUES (${RECRUITS_ENABLED_FLAG}, ${enabled}, NOW(), ${brotherId})
      ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value,
            updated_at = EXCLUDED.updated_at,
            updated_by = EXCLUDED.updated_by;
    `;
    return true;
  } catch (error) {
    if (isMissingTable(error)) {
      console.error(
        "site_flags table is missing — run `pnpm migrate:site-flags` before using the switch."
      );
    } else {
      console.error("❌ Error writing the recruits flag:", error);
    }
    return false;
  }
}
