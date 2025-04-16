import { Suspense } from "react";
import RecruitFilterTabs from "@/app/ui/recruits/RecruitFilterTabs";
import RecruitSectionWrapper from "@/app/ui/recruits/RecruitSectionWrapper";

type PageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  // ✅ Await the searchParams before using it
  const params = await searchParams;
  const tab = params?.tab || "ALL"; // ✅ Ensure a default value

  return (
    <div className="flex overflow-hidden flex-col py-64 bg-black max-md:py-24">
      <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-white max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
        RECRUITS
      </div>
      <div className="flex flex-col items-start px-14 pt-12 pb-40 mt-32 w-full bg-white max-md:px-5 max-md:pb-24 max-md:mt-10 max-md:max-w-full">
        
        {/* ✅ Tabs are now a separate Client Component */}
        <RecruitFilterTabs />

        {/* ✅ Suspense around dynamically imported Server Component */}
        <Suspense fallback={<div>Loading...</div>}>
          <RecruitSectionWrapper activeTab={tab} />
        </Suspense>
      </div>
    </div>
  );
}