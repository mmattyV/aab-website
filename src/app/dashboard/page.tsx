import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getDashboardAccess, loginRedirectFor } from "@/app/lib/board-access";
import { fetchAllBrothers, fetchAllRecruits } from "@/app/lib/data";
import { DashboardRow } from "@/app/lib/definitions";
import DashboardTable from "@/app/ui/dashboard/DashboardTable";
import RecruitsSwitch from "@/app/ui/dashboard/RecruitsSwitch";
import { fetchRecruitsFlag } from "@/app/lib/site-flags";
import {
  DashboardAccessDenied,
  DashboardShell,
} from "@/app/ui/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function Page() {
  const access = await getDashboardAccess();
  if (access.status === "signed-out") {
    redirect(loginRedirectFor("/dashboard"));
  }
  if (access.status === "forbidden") {
    return <DashboardAccessDenied />;
  }

  // Both lists are loaded once and combined here; the table filters in the
  // browser, so changing a filter doesn't cost another round trip.
  const [brothers, recruits, recruitsFlag] = await Promise.all([
    fetchAllBrothers(),
    fetchAllRecruits(),
    fetchRecruitsFlag(),
  ]);

  // Paired with the last name so the sort can order by it without smuggling
  // an extra column into the rows sent to the browser.
  const entries = [
    ...brothers.map((brother) => ({
      lastName: brother.last_name ?? "",
      row: {
        id: brother.id,
        type: "brother",
        name: `${brother.first_name} ${brother.last_name}`.trim(),
        year: brother.year,
        detail: brother.position ?? "",
        image_url: brother.image_url ?? "",
        isCurrentUser: brother.id === access.brother.id,
      } satisfies DashboardRow,
    })),
    ...recruits.map((recruit) => ({
      lastName: recruit.last_name ?? "",
      row: {
        id: recruit.id,
        type: "recruit",
        name: `${recruit.first_name} ${recruit.last_name}`.trim(),
        year: recruit.year,
        detail: recruit.room ?? "",
        image_url: recruit.image_url ?? "",
        isCurrentUser: false,
      } satisfies DashboardRow,
    })),
  ];

  // Newest class first, then alphabetical by last name within a class.
  entries.sort(
    (a, b) =>
      b.row.year - a.row.year ||
      a.lastName.localeCompare(b.lastName) ||
      a.row.name.localeCompare(b.row.name)
  );

  const rows: DashboardRow[] = entries.map((entry) => entry.row);

  return (
    <DashboardShell title="DASHBOARD">
      <div className="flex flex-col items-start px-14 pt-12 pb-40 mt-32 w-full bg-white max-md:px-5 max-md:pb-24 max-md:mt-10">
        <p className="text-lg text-gray-700 max-md:text-base">
          Edit or remove brother and recruit profiles.
        </p>

        <div className="mt-8 w-full">
          <RecruitsSwitch
            enabled={recruitsFlag.enabled}
            updatedAt={recruitsFlag.updatedAt}
            updatedBy={recruitsFlag.updatedBy}
          />
        </div>

        <div className="mt-10 w-full">
          <DashboardTable rows={rows} />
        </div>
      </div>
    </DashboardShell>
  );
}
