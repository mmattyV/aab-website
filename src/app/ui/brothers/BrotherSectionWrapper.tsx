import { fetchAllBrothers } from "@/app/lib/data";
import { BrotherYearSection } from "@/app/ui/brothers/BrotherYearSection";
import { isPublicPosition } from "@/app/lib/positions";

export default async function BrotherSectionWrapper({
  activeTab,
}: {
  activeTab: string;
}) {
  const allBrothers = await fetchAllBrothers();

  // ✅ Filter based on active tab
  const filteredBrothers =
    activeTab === "BOARD"
      ? allBrothers.filter(
          (brother) => isPublicPosition(brother.position)
        )
      : allBrothers;

  const years = Array.from(
    new Set(filteredBrothers.map((brother) => brother.year))
  );

  return (
    <div className="flex flex-col mt-9 max-w-full w-[1290px]">
      {years.map((year) => (
        <BrotherYearSection
          key={year}
          year={year.toString()}
          brothers={filteredBrothers.filter((brother) => brother.year === year)}
        />
      ))}
    </div>
  );
}
