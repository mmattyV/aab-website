"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { deleteProfiles } from "@/app/lib/actions";
import { DashboardRow, DashboardRowType } from "@/app/lib/definitions";
import { getImageUrl } from "@/app/utils/imageUrlHelper";

type TypeFilter = "ALL" | DashboardRowType;

/** Unique across both tables, so a brother and a recruit never share a key. */
function rowKey(row: DashboardRow): string {
  return `${row.type}:${row.id}`;
}

function editHref(row: DashboardRow): string {
  return `/dashboard/${row.type === "brother" ? "brothers" : "recruits"}/${
    row.id
  }/edit`;
}

const TYPE_LABEL: Record<DashboardRowType, string> = {
  brother: "Brother",
  recruit: "Recruit",
};

export default function DashboardTable({ rows }: { rows: DashboardRow[] }) {
  const router = useRouter();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  // Keyed rather than indexed so a selection survives filtering and refreshing.
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [pendingDeletion, setPendingDeletion] = useState<DashboardRow[] | null>(
    null
  );
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [isDeleting, startDeleting] = useTransition();

  // Year options come from every profile, not just the visible ones, so
  // switching the type filter never empties the year dropdown.
  const years = useMemo(
    () => Array.from(new Set(rows.map((row) => row.year))).sort((a, b) => b - a),
    [rows]
  );

  const visibleRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          (typeFilter === "ALL" || row.type === typeFilter) &&
          (yearFilter === "ALL" || String(row.year) === yearFilter)
      ),
    [rows, typeFilter, yearFilter]
  );

  // Derived from `rows` so keys left over from deleted profiles drop out on
  // their own, and so nobody's own row can end up in a delete request.
  const selectedRows = useMemo(
    () => rows.filter((row) => !row.isCurrentUser && selectedKeys.has(rowKey(row))),
    [rows, selectedKeys]
  );

  const selectableVisible = visibleRows.filter((row) => !row.isCurrentUser);
  const allVisibleSelected =
    selectableVisible.length > 0 &&
    selectableVisible.every((row) => selectedKeys.has(rowKey(row)));

  function toggleRow(row: DashboardRow) {
    setSelectedKeys((previous) => {
      const next = new Set(previous);
      const key = rowKey(row);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  /** Select-all covers the rows currently on screen, leaving the rest alone. */
  function toggleAllVisible() {
    setSelectedKeys((previous) => {
      const next = new Set(previous);
      for (const row of selectableVisible) {
        if (allVisibleSelected) {
          next.delete(rowKey(row));
        } else {
          next.add(rowKey(row));
        }
      }
      return next;
    });
  }

  function runDelete(targets: DashboardRow[]) {
    startDeleting(async () => {
      const result = await deleteProfiles({
        brotherIds: targets
          .filter((row) => row.type === "brother")
          .map((row) => row.id),
        recruitIds: targets
          .filter((row) => row.type === "recruit")
          .map((row) => row.id),
      });

      setFeedback({
        tone: result.status === "success" ? "success" : "error",
        message: result.message,
      });
      setPendingDeletion(null);

      if (result.status === "success") {
        const deleted = new Set([
          ...result.deletedBrotherIds.map((id) => `brother:${id}`),
          ...result.deletedRecruitIds.map((id) => `recruit:${id}`),
        ]);
        setSelectedKeys(
          (previous) => new Set([...previous].filter((key) => !deleted.has(key)))
        );
        router.refresh();
      }
    });
  }

  const pendingBrotherCount =
    pendingDeletion?.filter((row) => row.type === "brother").length ?? 0;
  const pendingRecruitCount =
    pendingDeletion?.filter((row) => row.type === "recruit").length ?? 0;

  return (
    <div className="w-full text-black">
      {/* Filters */}
      <div className="flex flex-wrap gap-6 items-end">
        <label className="flex flex-col text-sm font-semibold">
          Profile type
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as TypeFilter)
            }
            className="mt-1 rounded-md border border-gray-300 p-2 text-base focus:outline-none focus:ring-2 focus:ring-brandRed"
          >
            <option value="ALL">All</option>
            <option value="brother">Brother</option>
            <option value="recruit">Recruit</option>
          </select>
        </label>

        <label className="flex flex-col text-sm font-semibold">
          Graduation year
          <select
            value={yearFilter}
            onChange={(event) => setYearFilter(event.target.value)}
            className="mt-1 rounded-md border border-gray-300 p-2 text-base focus:outline-none focus:ring-2 focus:ring-brandRed"
          >
            <option value="ALL">All years</option>
            {years.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-4 items-center ml-auto max-md:ml-0">
          <span className="text-sm text-gray-600" aria-live="polite">
            {selectedRows.length} selected
          </span>
          <button
            type="button"
            disabled={selectedRows.length === 0 || isDeleting}
            onClick={() => setPendingDeletion(selectedRows)}
            className="bg-brandRed text-white px-5 py-2 rounded-md font-semibold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brandRed"
          >
            Delete selected
          </button>
        </div>
      </div>

      {/* Result banner */}
      {feedback && (
        <div
          className="flex gap-2 items-center mt-4"
          aria-live="polite"
          aria-atomic="true"
        >
          {feedback.tone === "success" ? (
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
          ) : (
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          )}
          <p
            className={`text-sm ${
              feedback.tone === "success" ? "text-green-700" : "text-red-500"
            }`}
          >
            {feedback.message}
          </p>
        </div>
      )}

      <p className="mt-6 text-sm text-gray-600">
        Showing {visibleRows.length} of {rows.length} profiles.
      </p>

      {visibleRows.length === 0 ? (
        <p className="mt-6 text-lg">No profiles match these filters.</p>
      ) : (
        <>
          {/* Table, from medium screens up */}
          <div className="mt-4 overflow-x-auto max-md:hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-300 text-sm uppercase tracking-wide text-gray-600">
                  <th scope="col" className="p-3 w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brandRed"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      disabled={selectableVisible.length === 0}
                      aria-label="Select all shown profiles"
                    />
                  </th>
                  <th scope="col" className="p-3">
                    Name
                  </th>
                  <th scope="col" className="p-3">
                    Type
                  </th>
                  <th scope="col" className="p-3">
                    Year
                  </th>
                  <th scope="col" className="p-3">
                    Position / Room
                  </th>
                  <th scope="col" className="p-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className="border-b border-gray-200 align-middle"
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-brandRed"
                        checked={selectedKeys.has(rowKey(row))}
                        onChange={() => toggleRow(row)}
                        disabled={row.isCurrentUser}
                        aria-label={`Select ${row.name}`}
                        title={
                          row.isCurrentUser
                            ? "You can't delete your own account"
                            : undefined
                        }
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-3 items-center">
                        <ProfileThumbnail row={row} />
                        <span className="font-semibold">
                          {row.name}
                          {row.isCurrentUser && (
                            <span className="ml-2 text-xs font-normal text-gray-500">
                              (you)
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">{TYPE_LABEL[row.type]}</td>
                    <td className="p-3">{row.year}</td>
                    <td className="p-3">{row.detail || "—"}</td>
                    <td className="p-3">
                      <div className="flex gap-3 justify-end">
                        <RowActions
                          row={row}
                          isDeleting={isDeleting}
                          onDelete={() => setPendingDeletion([row])}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stacked cards on phones, where a six-column table can't fit */}
          <ul className="mt-4 flex flex-col gap-4 md:hidden">
            {visibleRows.map((row) => (
              <li
                key={rowKey(row)}
                className="border border-gray-300 rounded-md p-4"
              >
                <div className="flex gap-3 items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brandRed"
                    checked={selectedKeys.has(rowKey(row))}
                    onChange={() => toggleRow(row)}
                    disabled={row.isCurrentUser}
                    aria-label={`Select ${row.name}`}
                  />
                  <ProfileThumbnail row={row} />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {row.name}
                      {row.isCurrentUser && (
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {TYPE_LABEL[row.type]} · {row.year}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-700 break-words">
                  {row.detail || "—"}
                </p>
                <div className="mt-3 flex gap-4">
                  <RowActions
                    row={row}
                    isDeleting={isDeleting}
                    onDelete={() => setPendingDeletion([row])}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Confirmation */}
      {pendingDeletion && pendingDeletion.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div className="bg-white rounded-md p-8 max-md:p-6 w-full max-w-md shadow-lg">
            <h2 id="delete-confirm-title" className="text-2xl font-bold">
              Delete permanently?
            </h2>
            <p className="mt-4">
              This will delete{" "}
              <strong>
                {pendingBrotherCount > 0 &&
                  `${pendingBrotherCount} brother${
                    pendingBrotherCount === 1 ? "" : "s"
                  }`}
                {pendingBrotherCount > 0 && pendingRecruitCount > 0 && " and "}
                {pendingRecruitCount > 0 &&
                  `${pendingRecruitCount} recruit${
                    pendingRecruitCount === 1 ? "" : "s"
                  }`}
              </strong>
              , along with their photos and any recruit comments. This can&apos;t
              be undone.
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPendingDeletion(null)}
                disabled={isDeleting}
                className="px-5 py-2 rounded-md font-semibold border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => runDelete(pendingDeletion)}
                disabled={isDeleting}
                className="bg-brandRed text-white px-5 py-2 rounded-md font-semibold hover:bg-black transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileThumbnail({ row }: { row: DashboardRow }) {
  if (!row.image_url) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-sm font-semibold text-gray-600 shrink-0">
        {row.name.charAt(0)}
      </div>
    );
  }

  return (
    <Image
      src={getImageUrl(row.image_url, "thumbnail")}
      alt=""
      width={40}
      height={40}
      className="w-10 h-10 rounded-full object-cover shrink-0"
    />
  );
}

function RowActions({
  row,
  isDeleting,
  onDelete,
}: {
  row: DashboardRow;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <>
      <Link
        href={editHref(row)}
        className="font-semibold text-brandRed hover:underline"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={row.isCurrentUser || isDeleting}
        title={
          row.isCurrentUser ? "You can't delete your own account" : undefined
        }
        className="font-semibold text-gray-700 hover:text-brandRed transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-700"
      >
        Delete
      </button>
    </>
  );
}
