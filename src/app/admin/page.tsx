import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { fetchAllBrothers, fetchAllRecruits } from "@/app/lib/data";
import AdminDashboard from "@/app/ui/admin/AdminDashboard";

export default async function AdminPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }
  
  if (!session.user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const brothers = await fetchAllBrothers();
  const recruits = await fetchAllRecruits();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage brothers and recruits</p>
        </div>
        <AdminDashboard 
          brothers={brothers} 
          recruits={recruits}
          adminId={session.user.id}
        />
      </div>
    </div>
  );
}
