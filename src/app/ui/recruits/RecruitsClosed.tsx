import Link from "next/link";

/**
 * Shown to a signed-in brother when the board has closed the recruits
 * section. Deliberately plain: it says the section is closed rather than
 * pretending it doesn't exist.
 */
export function RecruitsClosed({
  title = "RECRUITS",
  heading = "Recruits are closed right now",
  body = "The board has closed this section outside of recruitment season. It will come back when recruitment opens again.",
}: {
  /** The black banner above the panel. */
  title?: string;
  heading?: string;
  body?: string;
}) {
  return (
    <div className="flex overflow-hidden flex-col py-64 bg-black max-md:py-24">
      <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-white max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
        {title}
      </div>
      <div className="flex flex-col items-start px-14 pt-12 pb-40 mt-32 w-full bg-white text-black max-md:px-5 max-md:pb-24 max-md:mt-10">
        <h2 className="text-3xl font-bold max-md:text-2xl">{heading}</h2>
        <p className="mt-4 max-w-2xl text-lg text-gray-700 max-md:text-base">
          {body}
        </p>
        <Link
          href="/"
          className="mt-8 bg-brandRed text-white px-6 py-2 rounded-md font-semibold hover:bg-black transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
