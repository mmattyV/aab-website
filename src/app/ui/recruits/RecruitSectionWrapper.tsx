import { fetchAllComments, fetchAllRecruits } from "@/app/lib/data";
import { RecruitYearSection } from "@/app/ui/recruits/RecruitYearSection";
import { auth } from "@/auth";

// Roughly the first two rows of the grid. Everything past this lazy-loads, so
// the browser isn't racing dozens of preloads against the ones on screen.
const PRIORITY_IMAGE_BUDGET = 8;

export default async function RecruitSectionWrapper({
  activeTab,
}: {
  activeTab: string;
}) {
  // 1. Get the logged-in user
  const session = await auth();
  if (!session || !session.user?.email || !session.user?.id) {
    console.warn("⚠️ No user session found.");
    return <div>Please log in to view recruit data.</div>;
  }

  // 2. Your brother's ID
  const brotherId = session.user.id;

  // 3. Fetch all recruits & all comments
  const allRecruits = await fetchAllRecruits();
  const allComments = await fetchAllComments();

  // 4. Build a set of recruit_ids the logged-in brother has commented on
  const recruitIdsBrotherHasCommentedOn = new Set(
    allComments
      .filter((comment) => comment.brother_id === brotherId)
      .map((comment) => comment.recruit_id)
  );

  // 5. Filter based on activeTab
  let filteredRecruits = allRecruits;

  if (activeTab === "GRABBED MEAL") {
    // Only recruits that have a comment from this brother
    filteredRecruits = allRecruits.filter((recruit) =>
      recruitIdsBrotherHasCommentedOn.has(recruit.id)
    );
  } else if (activeTab === "NOT GRABBED MEAL") {
    // Only recruits that do *not* have a comment from this brother
    filteredRecruits = allRecruits.filter(
      (recruit) => !recruitIdsBrotherHasCommentedOn.has(recruit.id)
    );
  }

  // 6. Split recruits by year for display
  const years = Array.from(new Set(filteredRecruits.map((r) => r.year)));

  // Spend the preload budget across sections in render order rather than
  // restarting it inside every year.
  let remainingPriority = PRIORITY_IMAGE_BUDGET;

  return (
    <div className="flex flex-col mt-9 max-w-full w-[1290px]">
      {years.map((year) => {
        const yearRecruits = filteredRecruits.filter((r) => r.year === year);
        const priorityCount = Math.min(remainingPriority, yearRecruits.length);
        remainingPriority -= priorityCount;

        return (
          <RecruitYearSection
            key={year}
            year={year.toString()}
            recruits={yearRecruits}
            priorityCount={priorityCount}
          />
        );
      })}
    </div>
  );
}