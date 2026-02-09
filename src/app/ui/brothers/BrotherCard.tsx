import * as React from "react";
import { BrotherCardProps } from "@/app/lib/definitions";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/app/utils/imageUrlHelper";

export const BrotherCard: React.FC<BrotherCardProps> = ({
  first_name,
  last_name,
  house,
  position,
  image_url,
  id,
  priority = false, // Add priority prop for above-fold images
}) => {
  // Use thumbnail size for cards (400px width)
  const thumbnailUrl = getImageUrl(image_url, 'thumbnail');
  
  return (
    <Link
      href={`/brothers/${id}/details`}
      passHref
    >
      <div
        className="relative flex-none basis-[230px] aspect-[3/4] cursor-pointer
                   transition-all duration-300 group overflow-hidden"
      >
        {/* Next.js optimized image with lazy loading */}
        <Image
          src={thumbnailUrl}
          alt={`${first_name} ${last_name}`}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 230px"
          className="object-cover"
          priority={priority}
        />

        {/* Overlay to force the hover effect on both image and text */}
        <div className="absolute inset-0 bg-brandRed opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-screen z-10"></div>

        {/* Text Container Positioned at Bottom Left, Always White */}
        <div className="absolute bottom-4 left-4 text-white z-20 group-hover:text-white transition-colors duration-300">
          <div className="text-3xl text-shadow-sm leading-none">
            {first_name + " " + last_name}
          </div>
          <div className="text-sm text-shadow-sm leading-loose">
            {house + (position !== "New Brother" ? ` | ${position}` : ``)}
          </div>
        </div>
      </div>
    </Link>
  );
};
