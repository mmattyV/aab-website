import { Suspense } from "react";
import { auth } from "@/auth"; // or wherever your auth logic is defined
import BrotherFilterTabs from "@/app/ui/brothers/BrotherFilterTabs";
import BrotherSectionWrapper from "@/app/ui/brothers/BrotherSectionWrapper";

type PageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  // 1) Fetch user session to determine if logged in
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  // 2) Await the searchParams before using it
  const params = await searchParams;
  const tab = params?.tab || "ALL"; // Provide a default if undefined

  return (
    <div className="flex overflow-hidden flex-col py-64 bg-white max-md:py-24">
      {/* Page Title */}
      <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-black max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
        OUR BROTHERS
      </div>

      <div className="flex flex-col items-start px-14 pt-12 pb-40 mt-32 w-full bg-white max-md:px-5 max-md:pb-24 max-md:mt-10 max-md:max-w-full">
        {/* Conditionally Render Tabs if Logged In */}
        {isLoggedIn && (
          <BrotherFilterTabs />
        )}

        {/* Suspense around the Server Component for listing brothers */}
        <Suspense fallback={<div>Loading...</div>}>
          <BrotherSectionWrapper activeTab={tab} />
        </Suspense>
      </div>
    </div>
  );
}
