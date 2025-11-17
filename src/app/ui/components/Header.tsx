"use client";

import * as React from "react";
import MenuWrapper from "@/app/ui/components/MenuWrapper";
import { HeaderSection } from "@/app/ui/components/HeaderSection";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  
  return (
    <div className="flex z-50 fixed top-0 left-0 w-full gap-10 justify-between items-center py-5 px-10">
      <div className={`flex items-center gap-10 whitespace-nowrap max-sm:w-auto max-sm:grow-0 ${isHomepage ? "text-black" : "text-white"}`}>
        <Link
          href="/"
          className={`shrink-0 text-5xl font-bold px-3 max-md:text-4xl ${isHomepage ? "" : "text-shadow-lg"}`}
        >
          AAB
        </Link>
        <HeaderSection />
      </div>
      <MenuWrapper text="MENU" icon="/hamburger-menu.svg" />
    </div>
  );
};
