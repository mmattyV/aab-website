/**
 * Helpers for moving dates between the database and `<input type="date">`.
 *
 * The `birthday` column comes back from Postgres as a `Date` (node-postgres
 * parses `date`/`timestamp` columns for us), but a date input only accepts a
 * `YYYY-MM-DD` string, so an un-normalized value leaves the field blank.
 */

/**
 * Format a date value as `YYYY-MM-DD` for use as a date input's value.
 *
 * Accepts the `Date` objects Postgres returns as well as plain strings
 * (legacy text columns, placeholder data), and returns "" for anything
 * unusable so the input simply renders empty instead of erroring.
 */
export function toDateInputValue(
  date: string | Date | null | undefined
): string {
  if (!date) return "";

  if (typeof date === "string") {
    // Already `YYYY-MM-DD`, or an ISO timestamp we can slice the date off of.
    const match = date.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];

    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? "" : formatLocalDate(parsed);
  }

  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? "" : formatLocalDate(date);
  }

  return "";
}

/**
 * Use the local calendar date rather than the UTC one — Postgres `date`
 * values are parsed as local midnight, so `toISOString()` would roll the day
 * backwards for anyone west of UTC.
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Render a stored date for display, e.g. "April 15, 2003".
 *
 * `YYYY-MM-DD` strings are read as calendar dates rather than instants so the
 * day never shifts with the viewer's timezone.
 */
export function formatDisplayDate(
  date: string | Date | null | undefined,
  fallback = "Not provided"
): string {
  const value = toDateInputValue(date);
  if (!value) return fallback;

  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
