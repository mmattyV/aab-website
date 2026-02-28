import * as React from "react";
import { MissionProps } from "@/app/lib/definitions";
import { ActionButton } from "./ActionButton";

export const Mission: React.FC<MissionProps> = ({ text }) => (
  <div className="flex flex-wrap gap-12 items-start px-16 mt-32 max-w-full w-[822px] max-md:px-5 max-md:mt-10">
    <div className="grow shrink gap-2.5 self-stretch py-2.5 text-4xl text-black min-w-[240px] w-[659px] max-md:px-5 max-md:max-w-full">
      {text}
    </div>
    <ActionButton
      text="CONSTITUTION"
      icon="/right-arrow.svg"
      link="/constitution"
    />
    <ActionButton text="BROTHERS" icon="/right-arrow.svg" link="/brothers" />
  </div>
);
