import { fetchAllBrothers } from "@/app/lib/data";
import { BrotherYearSection } from "@/app/ui/brothers/BrotherYearSection";
import { isPublicPosition } from "@/app/lib/positions";

// Roughly the first two rows of the grid. Everything past this lazy-loads, so
// the browser isn't racing dozens of preloads against the ones on screen.
const PRIORITY_IMAGE_BUDGET = 8;

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

  // Spend the preload budget across sections in render order rather than
  // restarting it inside every year.
  let remainingPriority = PRIORITY_IMAGE_BUDGET;

  return (
    <div className="flex flex-col mt-9 max-w-full w-[1290px]">
      {years.map((year) => {
        const yearBrothers = filteredBrothers.filter(
          (brother) => brother.year === year
        );
        const priorityCount = Math.min(remainingPriority, yearBrothers.length);
        remainingPriority -= priorityCount;

        return (
          <BrotherYearSection
            key={year}
            year={year.toString()}
            brothers={yearBrothers}
            priorityCount={priorityCount}
          />
        );
      })}
    </div>
  );
}
