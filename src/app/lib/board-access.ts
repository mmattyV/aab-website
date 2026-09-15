import { auth } from "@/auth";
import { fetchBrotherPositionById } from "@/app/lib/data";
import { isBoardPosition } from "@/app/lib/positions";
import { fetchRecruitsEnabled } from "@/app/lib/site-flags";

/**
 * Server-side access control for the management dashboard.
 *
 * Every dashboard page and every edit/delete action goes through this module,
 * so a direct request can't reach a mutation the menu wouldn't have offered.
 */

export type SessionBrother = {
  id: string;
  position: string;
  /** Whether this brother may manage other people's profiles. */
  isBoardMember: boolean;
};

/**
 * The signed-in brother together with the position stored for them, or `null`
 * when nobody is signed in (or their account no longer exists).
 */
export async function getSessionBrother(): Promise<SessionBrother | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const position = await fetchBrotherPositionById(id);
  if (position === null) return null;

  return { id, position, isBoardMember: isBoardPosition(position) };
}

export type DashboardAccess =
  | { status: "allowed"; brother: SessionBrother }
  | { status: "signed-out" }
  | { status: "forbidden" };

/** Whether the current visitor may open a dashboard route, and why not. */
export async function getDashboardAccess(): Promise<DashboardAccess> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return { status: "signed-out" };

  const position = await fetchBrotherPositionById(id);
  if (!isBoardPosition(position)) return { status: "forbidden" };

  return {
    status: "allowed",
    brother: { id, position: position as string, isBoardMember: true },
  };
}

/** Where to send a signed-out visitor so they land back on the page they wanted. */
export function loginRedirectFor(pathname: string): string {
  return `/login?callbackUrl=${encodeURIComponent(pathname)}`;
}

export type RecruitsAccess =
  | { status: "allowed"; brother: SessionBrother }
  | { status: "signed-out" }
  /** The board has closed recruits to everyone outside it. */
  | { status: "closed" };

/**
 * Whether the current visitor may open the recruits section.
 *
 * Board members always may — they are the ones who close it, and they still
 * need to read what was collected. For everyone else it follows the switch.
 */
export async function getRecruitsAccess(): Promise<RecruitsAccess> {
  const brother = await getSessionBrother();
  if (!brother) return { status: "signed-out" };
  if (brother.isBoardMember) return { status: "allowed", brother };

  return (await fetchRecruitsEnabled())
    ? { status: "allowed", brother }
    : { status: "closed" };
}
