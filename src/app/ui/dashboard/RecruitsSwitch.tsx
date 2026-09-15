"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { setRecruitsEnabled } from "@/app/lib/actions";
import { formatDisplayDate } from "@/app/utils/dateHelper";

export default function RecruitsSwitch({
  enabled,
  updatedAt,
  updatedBy,
}: {
  enabled: boolean;
  /** ISO string rather than a Date, so it crosses the server boundary intact. */
  updatedAt: string | null;
  updatedBy: string | null;
}) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  // Tracked locally so the switch moves on click, before the refresh lands.
  const [isOn, setIsOn] = useState(enabled);

  function flip() {
    const next = !isOn;
    startSaving(async () => {
      const result = await setRecruitsEnabled(next);
      setFeedback({
        tone: result.status === "success" ? "success" : "error",
        message: result.message,
      });
      if (result.status === "success") {
        setIsOn(next);
        router.refresh();
      }
    });
  }

  return (
    <section className="w-full border border-gray-300 rounded-md p-6 max-md:p-4 text-black">
      <div className="flex gap-6 items-start justify-between max-md:flex-col max-md:gap-4">
        <div>
          <h2 className="text-2xl font-bold max-md:text-xl">Recruits section</h2>
          <p className="mt-2 max-w-2xl text-gray-700">
            {isOn
              ? "Open — every signed-in brother can see recruits and leave comments."
              : "Closed — only brothers with a board position can see recruits."}
          </p>
          {updatedAt && (
            <p className="mt-1 text-sm text-gray-500">
              Last changed {formatDisplayDate(updatedAt, "recently")}
              {updatedBy ? ` by ${updatedBy}` : ""}.
            </p>
          )}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-label="Recruits open to all brothers"
          onClick={flip}
          disabled={isSaving}
          className={`relative shrink-0 inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brandRed focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            isOn ? "bg-brandRed" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
              isOn ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>

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
    </section>
  );
}
