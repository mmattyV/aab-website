"use client";

import { RecruitOverviewField } from "@/app/lib/definitions";
import { deleteRecruit } from "@/app/lib/actions";
import { useActionState } from "react";
import { useState } from "react";

interface AdminRecruitCardProps {
  recruit: RecruitOverviewField;
}

export default function AdminRecruitCard({ recruit }: AdminRecruitCardProps) {
  const [state, formAction] = useActionState(deleteRecruit, { message: null });
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-start gap-4">
        <div
          className="w-24 h-32 bg-center bg-no-repeat bg-cover rounded"
          style={{
            backgroundImage: `url(${recruit.image_url})`,
          }}
        />
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-black">
            {recruit.first_name} {recruit.last_name}
          </h3>
          <p className="text-sm text-gray-600">{recruit.room}</p>
          <p className="text-sm text-gray-600">Class of {recruit.year}</p>
        </div>
      </div>

      {!showConfirm ? (
        <button
          onClick={handleDeleteClick}
          className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
        >
          Delete Recruit
        </button>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-red-600 mb-2">
            Are you sure you want to delete this recruit? This will also delete all comments about them.
          </p>
          <form action={formAction} className="flex gap-2">
            <input type="hidden" name="recruitId" value={recruit.id} />
            <button
              type="submit"
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
            >
              Confirm Delete
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-300 text-black py-2 px-4 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {state?.message && (
        <p className="mt-2 text-sm text-red-600">{state.message}</p>
      )}
    </div>
  );
}
