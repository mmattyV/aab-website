import * as React from "react";
import Image from "next/image";
import { HeroProps } from "@/app/lib/definitions";

export const Hero: React.FC<HeroProps> = ({ backgroundImage }) => (
  <div className="relative w-full text-center text-white bg-zinc-300 min-h-[857px] max-md:px-5 max-md:max-w-full">
    {/* Background image: served through the image optimizer so the browser only
        downloads a variant sized for its viewport instead of the full-res file */}
    <Image
      src={backgroundImage}
      alt=""
      fill
      sizes="100vw"
      quality={88}
      priority
      placeholder="blur"
      className="object-cover object-center"
    />

    {/* Overlay for adjusting opacity */}
    <div
      className="absolute inset-0 w-full h-full bg-black opacity-20"
      style={{
        mixBlendMode: "multiply", // Ensures the overlay blends with the image
      }}
    ></div>

    {/* Text at the bottom, centered horizontally */}
    <div
      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 px-4 text-9xl max-md:text-6xl max-sm:text-5xl leading-none"
    >
      ASIAN AMERICAN
      <br />
      BROTHERHOOD
    </div>
  </div>
);
