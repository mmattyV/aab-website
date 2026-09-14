import * as React from "react";
import Image from "next/image";
import { PillarProps } from "@/app/lib/definitions";

export const Pillar: React.FC<PillarProps & { additionalClasses?: string }> = ({
  title,
  description,
  backgroundImage,
  additionalClasses = "",
}) => (
  <div
    className={`relative flex flex-col lg:flex-row items-start lg:items-center pt-5 pb-64 pl-5 pr-5 w-full min-h-[643px] max-md:pb-24 max-md:pl-5 max-md:pr-5 max-md:max-w-full ${additionalClasses}`}
  >
    {/* Background image: below the fold, so it stays lazy and only downloads a
        viewport-sized variant instead of the full-res file */}
    <Image
      src={backgroundImage}
      alt=""
      fill
      sizes="100vw"
      quality={88}
      placeholder="blur"
      className="object-cover object-center"
    />

    {/* Transparent Overlay Layer */}
    <div className="absolute inset-0 w-full h-full bg-black opacity-50"></div>

    {/* Content Layer */}
    <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:gap-80 justify-start w-full max-md:gap-5">
      {/* Title */}
      <div className="text-6xl lg:text-7xl max-md:text-4xl text-left whitespace-nowrap lg:whitespace-normal text-white flex-shrink-0 lg:pl-10 max-lg:mx-8 max-md:mx-5">
        {title}
      </div>

      {/* Description */}
      <div className="text-3xl max-lg:text-2xl max-md:text-xl text-left text-white max-lg:mx-8 max-md:mx-5">
        {description}
      </div>
    </div>
  </div>
);
