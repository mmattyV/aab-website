import * as React from "react";
import { BrotherCard } from "./BrotherCard";
import { BrotherYearSectionProps } from "@/app/lib/definitions";

export const BrotherYearSection: React.FC<BrotherYearSectionProps> = ({
  year,
  brothers,
}) => {
  return (
    <div className="flex flex-col mt-9 max-w-full w-[1290px]">
      {/* Year Title */}
      <div className="gap-2.5 self-start p-2.5 text-5xl text-black whitespace-nowrap max-md:text-4xl">
        {year}
      </div>

      {/* Cards Container: Properly Handles Wrapping Without Expanding */}
      <div className="flex flex-wrap gap-11 justify-start pl-3 mt-3 w-full">
        {brothers.map((brother, index) => (
          <div key={index} className="flex-none basis-[230px]">
            <BrotherCard 
              {...brother} 
              priority={index < 4} // Prioritize first 4 cards (typically above the fold)
            />
          </div>
        ))}
      </div>
    </div>
  );
};
