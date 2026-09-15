export const BROTHER_POSITIONS = [
  "New Brother",
  "Archives",
  "Brotherhood Chair",
  "Recruitment Chair",
  "Activism Chair",
  "Service Chair",
  "Finance Chair",
  "Alumni Chair",
  "Tech Chair",
] as const;

export type BrotherPosition = (typeof BROTHER_POSITIONS)[number];

/** The position every brother starts with, before taking on a board role. */
export const NEW_BROTHER_POSITION = "New Brother";

/** Positions that can be stored on a profile but should not appear on public pages. */
const HIDDEN_PUBLIC_POSITIONS = new Set<string>([
  NEW_BROTHER_POSITION,
  "Tech Chair",
]);

export function isPublicPosition(position: string | null | undefined): boolean {
  return Boolean(position) && !HIDDEN_PUBLIC_POSITIONS.has(position as string);
}

export function getPublicPositionLabel(position: string | null | undefined): string {
  return isPublicPosition(position) ? (position as string) : "Brother";
}

/**
 * Whether a stored position grants access to the management dashboard.
 *
 * Every real position counts except "New Brother". Positions held over from
 * before {@link BROTHER_POSITIONS} existed (e.g. "President") still qualify,
 * so a rename of the list never locks a board member out of the dashboard.
 */
export function isBoardPosition(position: string | null | undefined): boolean {
  return Boolean(position?.trim()) && position !== NEW_BROTHER_POSITION;
}

/**
 * Whether a position may be *written* to a profile.
 *
 * New values have to come from {@link BROTHER_POSITIONS}, but a profile is
 * always allowed to keep the position it already has — otherwise a brother
 * carrying a legacy position could never save any other field.
 */
export function isAssignablePosition(
  position: string,
  currentPosition: string | null | undefined
): boolean {
  return (
    BROTHER_POSITIONS.includes(position as BrotherPosition) ||
    position === (currentPosition ?? "")
  );
}
