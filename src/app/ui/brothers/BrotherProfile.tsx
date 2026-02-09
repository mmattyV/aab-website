import * as React from "react";
import BackToButton from "@/app/ui/components/BackToButton";
import Image from "next/image";
import { ContactSection } from "@/app/ui/components/ContactSection";
import { BrotherProfileProps, ContactInfo } from "@/app/lib/definitions";
import { getImageUrl } from "@/app/utils/imageUrlHelper";

function formatDate(date: string | Date | null | undefined) {
  if (!date) return "Not provided";
  if (typeof date === "string") return date;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date);
}

type BrotherProfileComponentProps = BrotherProfileProps & {
  isLoggedIn?: boolean; // pass a boolean to decide what contact info to show
};

export function BrotherProfile({
  first_name = "Unknown",
  last_name = "",
  personal_email = "",
  school_email = "",
  brother_name = "",
  house = "",
  year = 0,
  birthday = "",
  location = "",
  phone = "",
  tagline = "",
  position = "",
  bio = "",
  instagram = "",
  image_url = "https://via.placeholder.com/150",
  isLoggedIn = false,
}: BrotherProfileComponentProps) {
  // Use full-size image for profile page
  const fullImageUrl = getImageUrl(image_url, 'full');
  
  // Build the contacts array
  // Always show personal & school emails
  // Only show phone & instagram if user is logged in
  const contacts: ContactInfo[] = [
    personal_email && {
      icon: "/email-r-icon.svg",
      text: personal_email,
      alt: "Personal email",
    },
    school_email && {
      icon: "/email-r-icon.svg",
      text: school_email,
      alt: "School email",
    },
    // If user is logged in, add phone & instagram
    isLoggedIn && instagram && {
      icon: "/instagram-icon.svg",
      text: `@${instagram}`,
      alt: "Instagram",
    },
    isLoggedIn && phone && {
      icon: "/phone-icon.svg",
      text: phone,
      alt: "Phone",
    },
  ].filter(Boolean) as ContactInfo[];

  return (
    <div className="flex flex-col bg-black text-white overflow-hidden py-80 max-md:py-24">
      {/* Header Info */}
      <div className="flex flex-col text-left w-full pl-16 max-sm:center max-md:pl-8">
        <div className="text-2xl pl-4">
          {year} | {house} | {position === "New Brother" ? "Brother" : position}
        </div>
        <div className="mt-6 text-8xl max-md:text-6xl pl-3">
          {first_name} {last_name}
        </div>
      </div>

      {/* Container: Image + Button + Text */}
      <div
        className="
          relative
          flex
          flex-col
          md:flex-row
          items-start
          gap-4
          mt-12
          max-md:mt-10
          max-md:max-w-full
          md:pr-52
        "
      >
        <Image
          src={fullImageUrl}
          alt={`Profile of ${first_name} ${last_name}`}
          width={487}
          height={650}
          priority
          className="
            object-contain
            w-full
            max-w-[487px]
            aspect-[0.75]
            min-w-[400px]
            max-md:mx-auto
          "
        />

        {/* Button: visible on md+ only, absolutely at top-right */}
        <div
          className="
            hidden
            md:block
            absolute
            top-0
            right-0
          "
        >
          <BackToButton
            text="Back"
            type="brothers"
            subText="TO BROTHERS"
            icon="/top-left-arrow.svg"
          />
        </div>

        {/* Text (tagline, bio, etc.) */}
        <div className="text-2xl ml-10 max-md:m-10">
          <div className="pb-2.5 pl-2.5 text-4xl leading-8">
            {tagline || "No tagline available"}
          </div>
          <div className="p-2.5 mt-1 text-xl leading-8">
            {bio || "No bio available"}
          </div>

          {/* Only show these if logged in */}
          {isLoggedIn && (
            <>
              <div className="p-2.5 mt-1">
                Hometown: {location || "Unknown"}
              </div>
              <div className="p-2.5 mt-1">
                Birthday: {formatDate(birthday)}
              </div>
              <div className="p-2.5 mt-1">
                Brother Name: {brother_name || "N/A"}
              </div>
            </>
          )}

          <div className="ml-2">
            <ContactSection contacts={contacts} firstName={first_name} />
          </div>
        </div>
      </div>
    </div>
  );
}