import MenuButton from "./MenuButton";
import { MenuWrapperProps } from "@/app/lib/definitions";
import { getSessionBrother } from "@/app/lib/board-access";
import { fetchRecruitsEnabled } from "@/app/lib/site-flags";

export default async function MenuWrapper({ text, icon }: MenuWrapperProps) {
  // One lookup covers both questions the menu asks: whether anyone is signed
  // in, and whether their position opens the dashboard.
  const sessionBrother = await getSessionBrother();

  // Mirrors getRecruitsAccess: the board always keeps the link, everyone else
  // only while recruits are open. Signed-out visitors never see it, so the
  // flag isn't worth a query for them.
  const canSeeRecruits = sessionBrother
    ? sessionBrother.isBoardMember || (await fetchRecruitsEnabled())
    : false;

  return (
    <MenuButton
      text={text}
      icon={icon}
      isLoggedIn={!!sessionBrother}
      isBoardMember={!!sessionBrother?.isBoardMember}
      canSeeRecruits={canSeeRecruits}
    />
  );
}
