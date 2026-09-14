#!/usr/bin/env tsx

import { sql } from "@vercel/postgres";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * Create the `site_flags` table backing the dashboard's on/off switches.
 *
 * Additive and idempotent: it creates nothing that already exists and never
 * drops or rewrites data, so re-running it is harmless.
 *
 * `updated_by` is ON DELETE SET NULL on purpose — deleting a brother from the
 * dashboard must not fail because they were the last to flip a switch.
 *
 * Usage:
 *   pnpm migrate:site-flags            # show what would run
 *   pnpm migrate:site-flags --execute  # apply it
 */
async function migrate() {
  const isDryRun = !process.argv.includes("--execute");

  console.log("\n🔧 Migration 001: site_flags\n");
  console.log(
    `Mode: ${isDryRun ? "🔎 DRY RUN (no changes will be made)" : "⚠️  EXECUTE MODE"}\n`
  );

  const statement = `CREATE TABLE IF NOT EXISTS site_flags (
  key        TEXT PRIMARY KEY,
  value      BOOLEAN NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES brothers(id) ON DELETE SET NULL
)`;

  console.log(statement + ";\n");

  if (isDryRun) {
    const existing = await sql`SELECT to_regclass('public.site_flags') AS table_name`;
    console.log(
      existing.rows[0]?.table_name
        ? "ℹ️  site_flags already exists — running this would be a no-op."
        : "ℹ️  site_flags does not exist yet — running this would create it."
    );
    console.log("\nRe-run with --execute to apply.\n");
    return;
  }

  await sql.query(statement);
  console.log("✅ site_flags is ready.\n");
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
