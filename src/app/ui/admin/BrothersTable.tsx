"use client";

import { useState } from "react";
import { BrotherOverviewField } from "@/app/lib/definitions";
import { deleteBrother } from "@/app/lib/actions";
import { useRouter } from "next/navigation";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface BrothersTableProps {
  brothers: BrotherOverviewField[];
  adminId: string;
}

export default function BrothersTable({ brothers, adminId }: BrothersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const filteredBrothers = brothers.filter((brother) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      brother.first_name.toLowerCase().includes(searchLower) ||
      brother.last_name.toLowerCase().includes(searchLower) ||
      brother.house.toLowerCase().includes(searchLower) ||
      brother.position.toLowerCase().includes(searchLower)
    );
  });

  const handleDeleteClick = (brother: BrotherOverviewField) => {
    setDeleteTarget({
      id: brother.id,
      name: `${brother.first_name} ${brother.last_name}`,
    });
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteBrother(deleteTarget.id, adminId);
      
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
          placeholder="Search brothers by name, house, or position..."
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
                House
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
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
            {filteredBrothers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No brothers found
                </td>
              </tr>
            ) : (
              filteredBrothers.map((brother) => (
                <tr key={brother.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={brother.image_url}
                          alt={`${brother.first_name} ${brother.last_name}`}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {brother.first_name} {brother.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {brother.house}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {brother.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {brother.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteClick(brother)}
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
          title="Delete Brother"
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
