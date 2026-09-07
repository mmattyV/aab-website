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

/** Positions that can be stored on a profile but should not appear on public pages. */
const HIDDEN_PUBLIC_POSITIONS = new Set<string>(["New Brother", "Tech Chair"]);

export function isPublicPosition(position: string | null | undefined): boolean {
  return Boolean(position) && !HIDDEN_PUBLIC_POSITIONS.has(position as string);
}

export function getPublicPositionLabel(position: string | null | undefined): string {
  return isPublicPosition(position) ? (position as string) : "Brother";
}
