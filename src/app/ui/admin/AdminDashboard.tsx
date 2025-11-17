import { fetchAllBrothers, fetchAllRecruits } from "@/app/lib/data";
import AdminBrotherCard from "./AdminBrotherCard";
import AdminRecruitCard from "./AdminRecruitCard";

export default async function AdminDashboard() {
  const brothers = await fetchAllBrothers();
  const recruits = await fetchAllRecruits();

  return (
    <div className="w-full">
      <div className="mb-12">
        <h2 className="text-4xl font-bold mb-6 text-black">Manage Brothers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brothers.map((brother) => (
            <AdminBrotherCard
              key={brother.id}
              brother={brother}
            />
          ))}
        </div>
        {brothers.length === 0 && (
          <p className="text-gray-500">No brothers found.</p>
        )}
      </div>

      <div className="mb-12">
        <h2 className="text-4xl font-bold mb-6 text-black">Manage Recruits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recruits.map((recruit) => (
            <AdminRecruitCard
              key={recruit.id}
              recruit={recruit}
            />
          ))}
        </div>
        {recruits.length === 0 && (
          <p className="text-gray-500">No recruits found.</p>
        )}
      </div>
    </div>
  );
}
