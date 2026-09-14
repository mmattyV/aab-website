import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getDashboardAccess, loginRedirectFor } from "@/app/lib/board-access";
import { fetchBrotherById } from "@/app/lib/data";
import EditProfileForm from "@/app/ui/components/EditProfileForm";
import {
  DashboardAccessDenied,
  DashboardShell,
} from "@/app/ui/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Edit Brother",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  const access = await getDashboardAccess();
  if (access.status === "signed-out") {
    redirect(loginRedirectFor(`/dashboard/brothers/${id}/edit`));
  }
  if (access.status === "forbidden") {
    return <DashboardAccessDenied />;
  }

  const brother = await fetchBrotherById(id);
  if (!brother) {
    return (
      <DashboardShell title="EDIT BROTHER">
        <div className="flex flex-col items-start px-14 pt-12 pb-40 mt-32 w-full bg-white text-black max-md:px-5 max-md:pb-24 max-md:mt-10">
          <h2 className="text-3xl font-bold max-md:text-2xl">
            That brother no longer exists
          </h2>
          <Link
            href="/dashboard"
            className="mt-8 bg-brandRed text-white px-6 py-2 rounded-md font-semibold hover:bg-black transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <div className="flex overflow-hidden flex-col py-64 bg-black max-md:py-24">
        <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-white max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
          EDIT BROTHER
        </div>
      </div>

      <div className="relative w-full flex flex-col items-center mt-[-5rem]">
        <div className="px-4 max-w-lg mx-auto w-full">
          <EditProfileForm
            brother={brother}
            id={id}
            heading={`Edit ${brother.first_name} ${brother.last_name}`}
            canEditPosition
            returnTo="dashboard"
          />
          <Link
            href="/dashboard"
            className="block mt-6 mb-10 text-center text-white hover:underline"
          >
            Cancel and return to the dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
