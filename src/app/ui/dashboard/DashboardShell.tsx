import Link from "next/link";

/**
 * The black title banner every dashboard route sits under, matching the
 * /brothers and /recruits pages.
 */
export function DashboardShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex overflow-hidden flex-col py-64 bg-black max-md:py-24">
      <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-white max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
        {title}
      </div>
      {children}
    </div>
  );
}

/**
 * Shown to a signed-in brother whose position doesn't cover profile
 * management — a plain explanation rather than a silent redirect.
 */
export function DashboardAccessDenied() {
  return (
    <DashboardShell title="DASHBOARD">
      <div className="flex flex-col items-start px-14 pt-12 pb-40 mt-32 w-full bg-white text-black max-md:px-5 max-md:pb-24 max-md:mt-10">
        <h2 className="text-3xl font-bold max-md:text-2xl">
          You don&apos;t have access to this page
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-gray-700 max-md:text-base">
          Profile management is limited to brothers holding a board position.
          If your position has changed recently, sign out and back in, or ask
          the Tech Chair to update it.
        </p>
        <Link
          href="/brothers"
          className="mt-8 bg-brandRed text-white px-6 py-2 rounded-md font-semibold hover:bg-black transition-colors"
        >
          Back to Brothers
        </Link>
      </div>
    </DashboardShell>
  );
}
