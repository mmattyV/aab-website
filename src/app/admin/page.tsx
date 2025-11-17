import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkIsAdmin } from "@/app/lib/data";
import AdminDashboard from "@/app/ui/admin/AdminDashboard";

export default async function Page() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const isAdmin = await checkIsAdmin(session.user.id);
  
  if (!isAdmin) {
    return (
      <div className="flex overflow-hidden flex-col py-64 bg-black max-md:py-24">
        <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-white max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
          ADMIN DASHBOARD
        </div>
        <div className="flex flex-col items-start px-14 pt-12 pb-40 mt-32 w-full bg-white max-md:px-5 max-md:pb-24 max-md:mt-10 max-md:max-w-full">
          <div className="text-2xl text-red-600">
            Unauthorized. Only admins can access this page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden flex-col py-64 bg-black max-md:py-24">
      <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-white max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
        ADMIN DASHBOARD
      </div>
      <div className="flex flex-col items-start px-14 pt-12 pb-40 mt-32 w-full bg-white max-md:px-5 max-md:pb-24 max-md:mt-10 max-md:max-w-full">
        <Suspense fallback={<div>Loading...</div>}>
          <AdminDashboard />
        </Suspense>
      </div>
    </div>
  );
}
