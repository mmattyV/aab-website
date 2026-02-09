// app/ui/recruits/RecruitProfile.tsx

import * as React from "react";
import BackToButton from "@/app/ui/components/BackToButton";
import Image from "next/image";
import { ContactSection } from "@/app/ui/components/ContactSection";
import {
  RecruitProfileProps,
  ContactInfo,
  RecruitCommentProps,
} from "@/app/lib/definitions";
import { auth } from "@/auth"; // Correctly import auth from auth.ts
import Link from "next/link";
import { FaEdit, FaPlus } from "react-icons/fa";
import { getImageUrl } from "@/app/utils/imageUrlHelper";

export async function RecruitProfile({
  id = "",
  first_name = "Unknown",
  last_name = "",
  email = "",
  phone = "",
  year = 0,
  room = "",
  image_url = "https://via.placeholder.com/150",
  comments = [],
}: RecruitProfileProps & { comments: RecruitCommentProps[] }) {
  // Use full-size image for profile page
  const fullImageUrl = getImageUrl(image_url, 'full');
  
  // 1. Get the logged-in user
  const session = await auth();
  if (!session || !session.user?.email || !session.user?.id) {
    console.warn("⚠️ No user session found.");
    return (
      <div className="p-4 text-center text-red-500">
        Please log in to view recruit data.
      </div>
    );
  }

  // 2. Your brother's ID
  const brotherId = session.user.id;
  console.log("Brother ID is: ", brotherId);

  // 3. Check if the logged-in brother has already left a comment
  const existingComment = comments.find(
    (comment) => comment.brother_id === brotherId
  );
  console.log("Existing comment:", existingComment);

  // 4. Filter out empty contacts
  const contacts: ContactInfo[] = [
    email && {
      icon: "/email-r-icon.svg",
      text: email,
      alt: "Personal email",
    },
    phone && {
      icon: "/phone-icon.svg",
      text: phone,
      alt: "Phone",
    },
  ].filter(Boolean) as ContactInfo[];

  console.log("Recruit id is: ", id);

  // 5. Safely separate red flags from comments
  const redFlags = comments.filter(
    (comment) =>
      comment.red_flag && comment.red_flag.toUpperCase() !== "NONE"
  );

  // 6. Recruit Comments include all comment bodies
  const recruitComments = comments.map((comment) => ({
    brother_id: comment.brother_id,
    comment: comment.comment,
  }));

  return (
    <div className="flex flex-col bg-black text-white overflow-hidden py-80 max-md:py-24">
      {/* Header Info */}
      <div className="flex flex-col text-left w-full pl-16 max-sm:center max-md:pl-8">
        <div className="text-2xl pl-4">
          {year} | {room}
        </div>
        <div className="mt-6 text-8xl max-md:text-6xl pl-3">
          {first_name} {last_name}
        </div>
      </div>

      {/* Image + Button + Text */}
      <div className="relative flex flex-col md:flex-row items-start gap-4 mt-12 max-md:mt-10 max-md:max-w-full md:pr-52">
        <Image
          src={fullImageUrl}
          alt={`Profile of ${first_name} ${last_name}`}
          width={487}
          height={650}
          priority
          className="object-contain w-full max-w-[487px] aspect-[0.75] min-w-[400px] max-md:mx-auto"
        />

        {/* Button: visible on md+ only, absolutely at top-right */}
        <div className="hidden md:block absolute top-0 right-0">
          <BackToButton
            text="Back"
            type="recruits"
            subText="TO RECRUITS"
            icon="/top-left-arrow.svg"
          />
        </div>

        {/* Text (tagline, bio, etc.) */}
        <div className="text-2xl ml-10 max-md:m-10">
          {/* Add/Edit Comment Button */}
          <div className="ml-2 mb-6">
            {existingComment ? (
              <Link
                href={`/recruits/${id}/edit-comment`}
                className="px-3 py-2 bg-brandRed hover:bg-white hover:text-black transition text-white rounded-full flex items-center gap-1 text-sm w-fit"
              >
                <FaEdit className="text-xs mr-1" />
                Edit Comment
              </Link>
            ) : (
              <Link
                href={`/recruits/${id}/add-comment`}
                className="px-3 py-2 bg-brandRed hover:bg-white hover:text-black transition text-white rounded-full flex items-center gap-1 text-sm w-fit"
              >
                <FaPlus className="text-xs mr-1" />
                Add Comment
              </Link>
            )}
          </div>

          {/* Recruit Comments Section */}
          <div className="ml-2">
            <h3 className="text-3xl font-semibold mb-2">Recruit Comments</h3>
            {recruitComments.length > 0 ? (
              <ul className="space-y-4">
                {recruitComments.map((comment, index) => (
                  <li
                    key={`${comment.brother_id}-${index}`}
                    className="border-b border-gray-500 pb-2"
                  >
                    <p className="text-lg">{comment.comment}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No comments available.</p>
            )}
          </div>

          {/* Red Flags Section */}
          <div className="ml-2 mt-6">
            <h3 className="text-3xl font-semibold mb-2 text-red-500">
              Red Flags
            </h3>
            {redFlags.length > 0 ? (
              <ul className="space-y-4">
                {redFlags.map((comment, index) => (
                  <li
                    key={`${comment.brother_id}-rf-${index}`}
                    className="border-b border-red-500 pb-2"
                  >
                    <p className="text-lg text-red-400">{comment.red_flag}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No red flags available.</p>
            )}
          </div>

          {/* Contact Section */}
          <div className="ml-2 mt-6">
            <ContactSection contacts={contacts} firstName={first_name} />
          </div>
        </div>
      </div>
    </div>
  );
}