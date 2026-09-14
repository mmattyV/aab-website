"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef } from "react";
import { updateBrotherProfile, State } from "@/app/lib/actions";
import { BrotherProfileProps } from "@/app/lib/definitions";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import Image from "next/image";
import { BROTHER_POSITIONS } from "@/app/lib/positions";
import { getImageUrl } from "@/app/utils/imageUrlHelper";
import { toDateInputValue } from "@/app/utils/dateHelper";
import {
  prepareImageForUpload,
  setInputFile,
  ImagePrepError,
} from "@/app/utils/prepareImage";

export default function EditProfileForm({
  brother,
  id,
}: {
  brother: BrotherProfileProps;
  id: string;
}) {
  const initialState: State = { message: null, errors: {} };
  const [state, formAction] = useActionState(
    updateBrotherProfile,
    initialState
  );

  const [imageError, setImageError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPreparingImage, setIsPreparingImage] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Saving is only gated once the form is interactive. Rendering the button
  // enabled on the server means a failed hydration leaves a usable form —
  // the action rejects an unchanged submit on its own.
  const [isInteractive, setIsInteractive] = useState(false);
  useEffect(() => setIsInteractive(true), []);

  // What the form started with, in the same string shape the inputs submit.
  const initialValues = useMemo<Record<string, string>>(
    () => ({
      first_name: brother.first_name ?? "",
      last_name: brother.last_name ?? "",
      personal_email: brother.personal_email ?? "",
      school_email: brother.school_email ?? "",
      year: brother.year ? String(brother.year) : "",
      phone: brother.phone ?? "",
      house: brother.house ?? "",
      brother_name: brother.brother_name ?? "",
      birthday: toDateInputValue(brother.birthday),
      location: brother.location ?? "",
      tagline: brother.tagline ?? "",
      position: brother.position ?? "",
      bio: brother.bio ?? "",
      instagram: brother.instagram ?? "",
    }),
    [brother]
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

  // The picture already on file, shown until the brother picks a new one.
  const currentImageUrl = brother.image_url
    ? getImageUrl(brother.image_url, "medium")
    : null;
  const previewUrl = imagePreview ?? currentImageUrl;

  // Downscale (and convert HEIC) in the browser, then put the result back into
  // the input so the form submits the small JPEG rather than the original.
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const input = e.target;
    const file = input.files?.[0];

    if (!file) {
      setImagePreview(null); // Selection cleared — show the current picture
      recomputeDirty();
      return;
    }

    setIsPreparingImage(true);
    try {
      const prepared = await prepareImageForUpload(file);
      setInputFile(input, prepared.file);
      setImagePreview(prepared.previewUrl);
    } catch (error) {
      setImageError(
        error instanceof ImagePrepError
          ? error.message
          : "Could not process that image."
      );
      input.value = ""; // Reset the input
      setImagePreview(null); // Fall back to the current picture
    } finally {
      setIsPreparingImage(false);
      recomputeDirty();
    }
  };

  // Constants for dropdown lists. The stored value is folded in so an older
  // year or a retired position still prefills instead of silently resetting
  // to whichever option happens to be first.
  const currentYear = brother.year ? String(brother.year) : "";
  const validYears = ["2028", "2027", "2026", "2025"];
  const years =
    currentYear && !validYears.includes(currentYear)
      ? [...validYears, currentYear]
      : validYears;
  const positions: string[] = BROTHER_POSITIONS.includes(
    brother.position as (typeof BROTHER_POSITIONS)[number]
  )
    ? [...BROTHER_POSITIONS]
    : [...BROTHER_POSITIONS, brother.position].filter(Boolean);

  const isSaveDisabled =
    !!imageError || isPreparingImage || (isInteractive && !isDirty);

  return (
    <form
      ref={formRef}
      action={formAction}
      onChange={recomputeDirty}
      className="flex flex-col w-full bg-white text-black rounded-md p-10 max-md:p-6 shadow-lg relative"
    >
      <h2 className="text-4xl font-bold mb-4">Edit Brother Profile</h2>

      {/* Hidden ID field */}
      <input type="hidden" name="brotherId" value={id} />

      {/* First Name */}
      <label htmlFor="first_name" className="mb-2 font-semibold text-lg">
        First Name
      </label>
      <input
        id="first_name"
        type="text"
        name="first_name"
        defaultValue={brother.first_name}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      />

      {/* Last Name */}
      <label htmlFor="last_name" className="mb-2 font-semibold text-lg">
        Last Name
      </label>
      <input
        id="last_name"
        type="text"
        name="last_name"
        defaultValue={brother.last_name}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      />

      {/* Personal Email */}
      <label htmlFor="personal_email" className="mb-2 font-semibold text-lg">
        Personal Email
      </label>
      <input
        id="personal_email"
        type="email"
        name="personal_email"
        defaultValue={brother.personal_email}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      />

      {/* School Email */}
      <label htmlFor="school_email" className="mb-2 font-semibold text-lg">
        School Email
      </label>
      <input
        id="school_email"
        type="email"
        name="school_email"
        defaultValue={brother.school_email}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      />

      {/* Year Dropdown */}
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

      {/* Phone Number */}
      <label htmlFor="phone" className="mb-2 font-semibold text-lg">
        Phone Number
      </label>
      <input
        id="phone"
        type="text"
        name="phone"
        defaultValue={brother.phone}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      />

      {/* House */}
      <label htmlFor="house" className="mb-2 font-semibold text-lg">
        House
      </label>
      <input
        id="house"
        type="text"
        name="house"
        defaultValue={brother.house}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      />

      {/* Brother Name */}
      <label htmlFor="brother_name" className="mb-2 font-semibold text-lg">
        Brother Name
      </label>
      <input
        id="brother_name"
        type="text"
        name="brother_name"
        defaultValue={brother.brother_name}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      />

      {/* Birthday */}
      <label htmlFor="birthday" className="mb-2 font-semibold text-lg">
        Birthday
      </label>
      <input
        id="birthday"
        type="date"
        name="birthday"
        defaultValue={toDateInputValue(brother.birthday)}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      />

      {/* Location */}
      <label htmlFor="location" className="mb-2 font-semibold text-lg">
        Location
      </label>
      <input
        id="location"
        type="text"
        name="location"
        defaultValue={brother.location}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      />

      {/* Tagline */}
      <label htmlFor="tagline" className="mb-2 font-semibold text-lg">
        Tagline
      </label>
      <input
        id="tagline"
        type="text"
        name="tagline"
        defaultValue={brother.tagline}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      />

      {/* Position */}
      <label htmlFor="position" className="mb-2 font-semibold text-lg">
        Position
      </label>
      <select
        id="position"
        name="position"
        defaultValue={brother.position}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
        required
      >
        {positions.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {/* Bio */}
      <label htmlFor="bio" className="mb-2 font-semibold text-lg">
        Bio
      </label>
      <textarea
        id="bio"
        name="bio"
        defaultValue={brother.bio}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed h-24"
        required
      />

      {/* Instagram (optional) */}
      <label htmlFor="instagram" className="mb-2 font-semibold text-lg">
        Instagram Handle (optional)
      </label>
      <input
        id="instagram"
        type="text"
        name="instagram"
        defaultValue={brother.instagram || ""}
        className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
      />

      {/* Replace or Upload New Profile Picture */}
      <label htmlFor="image" className="mb-2 font-semibold text-lg">
        Replace Profile Picture
      </label>
      {currentImageUrl && (
        <p className="text-sm text-gray-500 mb-2">
          Leave this empty to keep your current picture.
        </p>
      )}
      <input
        id="image"
        type="file"
        name="image"
        accept=".jpeg,.jpg,.png,.heic,.heif,image/jpeg,image/png,image/heic,image/heif"
        className="rounded-md border border-gray-300 p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-brandRed"
        onChange={handleImageChange}
      />
      {imageError && <p className="text-sm text-red-500 mb-4">{imageError}</p>}
      {isPreparingImage && (
        <p className="text-sm text-gray-500 mb-4">Preparing image…</p>
      )}

      {previewUrl && (
        <div className="mt-2 mb-4">
          <p className="text-sm font-semibold mb-1">
            {imagePreview ? "New picture" : "Current picture"}
          </p>
          <Image
            src={previewUrl}
            width={128} // Explicitly set width
            height={128} // Explicitly set height
            alt={imagePreview ? "New profile picture preview" : "Current profile picture"}
            className="object-cover rounded-md w-32 h-32"
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSaveDisabled}
        className={`bg-brandRed text-white py-2 rounded-md font-semibold hover:bg-black transition-colors ${
          isSaveDisabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        Update Profile
      </button>
      {isInteractive && !isDirty && !imageError && !isPreparingImage && (
        <p className="text-sm text-gray-500 mt-2">
          Edit a field to enable saving.
        </p>
      )}

      {/* Error Message Section */}
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
