"use client";

import * as React from "react";
import { HeaderSection } from "@/app/ui/components/HeaderSection";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const HeaderContent: React.FC = () => {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  
  return (
    <div className={`flex items-center gap-10 whitespace-nowrap max-sm:w-auto max-sm:grow-0 ${isHomepage ? "text-black" : "text-white"}`}>
      <Link
        href="/"
        className={`shrink-0 text-5xl font-bold px-3 max-md:text-4xl ${isHomepage ? "" : "text-shadow-lg"}`}
      >
        AAB
      </Link>
      <HeaderSection />
    </div>
  );
};
