"use client";

import { useActionState } from "react";
import { createRecruitAccount, State } from "@/app/lib/actions";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import Image from "next/image";
import {
  prepareImageForUpload,
  setInputFile,
  ImagePrepError,
} from "@/app/utils/prepareImage";
import { getValidGraduationYears } from "@/app/lib/graduation-years";

export default function RecruitSignUpForm() {
  const initialState: State = { message: null, errors: {} };
  const [recruitState, recruitFormAction] = useActionState(
    createRecruitAccount,
    initialState
  );

  const [imageError, setImageError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPreparingImage, setIsPreparingImage] = useState(false);

  // Downscale (and convert HEIC) in the browser, then put the result back into
  // the input so the form submits the small JPEG rather than the original.
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const input = e.target;
    const file = input.files?.[0];

    if (!file) {
      setImagePreview(null);
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
      setImagePreview(null);
    } finally {
      setIsPreparingImage(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header Section */}
      <div className="flex overflow-hidden flex-col py-64 bg-black max-md:py-24">
        <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-white max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
          SIGN UP AS RECRUIT
        </div>
      </div>

      {/* Main Form Container */}
      <div className="relative w-full flex flex-col items-center mt-[-5rem]">
        <div className="px-4 max-w-lg mx-auto w-full">
          <form
            action={recruitFormAction}
            className="flex flex-col w-full bg-white text-black rounded-md p-10 max-md:p-6 shadow-lg relative"
          >
            {/* Title */}
            <h2 className="text-4xl font-bold mb-4">Sign Up as a Recruit</h2>

            {/* First Name */}
            <label htmlFor="first_name" className="mb-2 font-semibold text-lg">
              First Name
            </label>
            <input
              id="first_name"
              type="text"
              name="first_name"
              placeholder="First Name"
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
              placeholder="Last Name"
              className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
              required
            />

            {/* Email */}
            <label htmlFor="email" className="mb-2 font-semibold text-lg">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
              required
            />

            {/* Graduation Year */}
            <label htmlFor="year" className="mb-2 font-semibold text-lg">
              Graduation Year
            </label>
            <select
              id="year"
              name="year"
              className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
              required
            >
              {getValidGraduationYears().map((yearVal) => (
                <option key={yearVal} value={yearVal}>
                  {yearVal}
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
              placeholder="123-456-7890"
              className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
              required
            />

            {/* Room */}
            <label htmlFor="room" className="mb-2 font-semibold text-lg">
              Room
            </label>
            <input
              id="room"
              type="text"
              name="room"
              placeholder="Lowell E-41"
              className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
              required
            />

            {/* Image Upload */}
            <label htmlFor="image" className="mb-2 font-semibold text-lg">
              Upload Profile Picture
            </label>
            <input
              id="image"
              type="file"
              name="image"
              accept=".jpeg,.jpg,.png,.heic,.heif,image/jpeg,image/png,image/heic,image/heif"
              className="rounded-md border border-gray-300 p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-brandRed"
              required
              onChange={handleImageChange}
            />
            {imageError && (
              <p className="text-sm text-red-500 mb-4">{imageError}</p>
            )}
            {isPreparingImage && (
              <p className="text-sm text-gray-400 mb-4">Preparing image…</p>
            )}

            {imagePreview && (
              <Image
                src={imagePreview}
                width={128} // Explicitly set width
                height={128} // Explicitly set height
                alt="Image Preview"
                className="mt-2 mb-4 object-cover rounded-md"
              />
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!!imageError || isPreparingImage}
              className={`bg-brandRed text-white py-2 rounded-md font-semibold hover:bg-black transition-colors ${
                imageError || isPreparingImage
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              Sign Up as a Recruit
            </button>

            {/* Error Message */}
            <div
              className="flex h-8 items-end space-x-1 mt-2"
              aria-live="polite"
              aria-atomic="true"
            >
              {recruitState.message && (
                <>
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-500">{recruitState.message}</p>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
