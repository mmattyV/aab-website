"use client";

import { useState } from "react";
import { RecruitOverviewField } from "@/app/lib/definitions";
import { deleteRecruit } from "@/app/lib/actions";
import { useRouter } from "next/navigation";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface RecruitsTableProps {
  recruits: RecruitOverviewField[];
  adminId: string;
}

export default function RecruitsTable({ recruits, adminId }: RecruitsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const filteredRecruits = recruits.filter((recruit) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      recruit.first_name.toLowerCase().includes(searchLower) ||
      recruit.last_name.toLowerCase().includes(searchLower) ||
      recruit.room.toLowerCase().includes(searchLower)
    );
  });

  const handleDeleteClick = (recruit: RecruitOverviewField) => {
    setDeleteTarget({
      id: recruit.id,
      name: `${recruit.first_name} ${recruit.last_name}`,
    });
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteRecruit(deleteTarget.id, adminId);
      
      if (result.success) {
        setDeleteTarget(null);
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
    setError(null);
  };

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search recruits by name or room..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecruits.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No recruits found
                </td>
              </tr>
            ) : (
              filteredRecruits.map((recruit) => (
                <tr key={recruit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={recruit.image_url}
                          alt={`${recruit.first_name} ${recruit.last_name}`}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {recruit.first_name} {recruit.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {recruit.room}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {recruit.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteClick(recruit)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <DeleteConfirmationModal
          title="Delete Recruit"
          message={`Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone and will also delete all associated comments.`}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isDeleting={isDeleting}
          error={error}
        />
      )}
    </div>
  );
}
