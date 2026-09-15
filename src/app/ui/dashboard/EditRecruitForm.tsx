"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { updateRecruitProfile, State } from "@/app/lib/actions";
import { Recruit } from "@/app/lib/definitions";
import { getImageUrl } from "@/app/utils/imageUrlHelper";
import { getGraduationYearOptions } from "@/app/lib/graduation-years";

export default function EditRecruitForm({ recruit }: { recruit: Recruit }) {
  const initialState: State = { message: null, errors: {} };
  const [state, formAction] = useActionState(
    updateRecruitProfile,
    initialState
  );

  const [imageError, setImageError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Saving is only gated once the form is interactive, so a failed hydration
  // still leaves a usable form — the action rejects an unchanged submit itself.
  const [isInteractive, setIsInteractive] = useState(false);
  useEffect(() => setIsInteractive(true), []);

  // What the form started with, in the same string shape the inputs submit.
  const initialValues = useMemo<Record<string, string>>(
    () => ({
      first_name: recruit.first_name ?? "",
      last_name: recruit.last_name ?? "",
      email: recruit.email ?? "",
      year: recruit.year ? String(recruit.year) : "",
      phone: recruit.phone ?? "",
      room: recruit.room ?? "",
    }),
    [recruit]
  );

  // Re-read the whole form rather than tracking each field, so reverting an
  // edit marks the form clean again.
  const recomputeDirty = useCallback(() => {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);

    const fieldChanged = Object.entries(initialValues).some(
      ([name, initial]) => (data.get(name)?.toString() ?? "") !== initial
    );
    const file = data.get("image");
    const hasNewImage = file instanceof File && file.size > 0;

    setIsDirty(fieldChanged || hasNewImage);
  }, [initialValues]);

  // The picture already on file, shown until a new one is picked.
  const currentImageUrl = recruit.image_url
    ? getImageUrl(recruit.image_url, "medium")
    : null;
  const previewUrl = imagePreview ?? currentImageUrl;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setImageError("Image must be under 5MB");
        e.target.value = ""; // Reset the input
        setImagePreview(null); // Fall back to the current picture
        return;
      }

      const allowedExtensions = ["jpeg", "jpg", "png"];
      const allowedMimeTypes = ["image/jpeg", "image/png"];

      const extension = file.name.split(".").pop()?.toLowerCase();
      const isValidExtension =
        extension && allowedExtensions.includes(extension);
      const isValidMimeType = allowedMimeTypes.includes(file.type);

      if (!isValidExtension || !isValidMimeType) {
        setImageError("Only JPEG, JPG, and PNG files are allowed.");
        e.target.value = ""; // Reset the input
        setImagePreview(null); // Fall back to the current picture
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null); // Selection cleared — show the current picture
    }
    recomputeDirty();
  };

  // The stored year is folded in so a class that's aged out of the list still
  // prefills instead of silently resetting to whichever option comes first.
  const currentYear = recruit.year ? String(recruit.year) : "";
  const years = getGraduationYearOptions(currentYear);

  const isSaveDisabled = !!imageError || (isInteractive && !isDirty);

  return (
    <form
      ref={formRef}
      action={formAction}
      onChange={recomputeDirty}
      className="flex flex-col w-full bg-white text-black rounded-md p-10 max-md:p-6 shadow-lg relative"
    >
      <h2 className="text-4xl font-bold mb-4 max-md:text-3xl">
        Edit {recruit.first_name} {recruit.last_name}
      </h2>

      <input type="hidden" name="recruitId" value={recruit.id} />

      <label htmlFor="first_name" className="mb-2 font-semibold text-lg">
        First Name
      </label>
      <input
        id="first_name"
        type="text"
        name="first_name"
        defaultValue={recruit.first_name}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      />

      <label htmlFor="last_name" className="mb-2 font-semibold text-lg">
        Last Name
      </label>
      <input
        id="last_name"
        type="text"
        name="last_name"
        defaultValue={recruit.last_name}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      />

      <label htmlFor="email" className="mb-2 font-semibold text-lg">
        Email
      </label>
      <input
        id="email"
        type="email"
        name="email"
        defaultValue={recruit.email}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      />

      <label htmlFor="year" className="mb-2 font-semibold text-lg">
        Graduation Year
      </label>
      <select
        id="year"
        name="year"
        defaultValue={currentYear}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      <label htmlFor="phone" className="mb-2 font-semibold text-lg">
        Phone Number
      </label>
      <input
        id="phone"
        type="text"
        name="phone"
        defaultValue={recruit.phone}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      />

      <label htmlFor="room" className="mb-2 font-semibold text-lg">
        Room
      </label>
      <input
        id="room"
        type="text"
        name="room"
        defaultValue={recruit.room}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      />

      <label htmlFor="image" className="mb-2 font-semibold text-lg">
        Replace Profile Picture (no .heic or .heif files)
      </label>
      {currentImageUrl && (
        <p className="text-sm text-gray-500 mb-2">
          Leave this empty to keep the current picture.
        </p>
      )}
      <input
        id="image"
        type="file"
        name="image"
        accept=".jpeg,.jpg,.png,image/jpeg,image/png"
        className="rounded-md border border-gray-300 p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-brandRed"
        onChange={handleImageChange}
      />
      {imageError && <p className="text-sm text-red-500 mb-4">{imageError}</p>}

      {previewUrl && (
        <div className="mt-2 mb-4">
          <p className="text-sm font-semibold mb-1">
            {imagePreview ? "New picture" : "Current picture"}
          </p>
          <Image
            src={previewUrl}
            width={128}
            height={128}
            alt={imagePreview ? "New profile picture preview" : "Current profile picture"}
            className="object-cover rounded-md w-32 h-32"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isSaveDisabled}
        className={`bg-brandRed text-white py-2 rounded-md font-semibold hover:bg-black transition-colors ${
          isSaveDisabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        Update Recruit
      </button>
      {isInteractive && !isDirty && !imageError && (
        <p className="text-sm text-gray-500 mt-2">
          Edit a field to enable saving.
        </p>
      )}

      <div
        className="flex h-8 items-end space-x-1 mt-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {state.message && (
          <>
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-500">{state.message}</p>
          </>
        )}
      </div>
    </form>
  );
}
