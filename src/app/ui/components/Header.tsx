import * as React from "react";
import MenuWrapper from "@/app/ui/components/MenuWrapper";
import { HeaderContent } from "@/app/ui/components/HeaderContent";

export const Header: React.FC = () => (
  <div className="flex z-50 fixed top-0 left-0 w-full gap-10 justify-between items-center py-5 px-10">
    <HeaderContent />
    <MenuWrapper text="MENU" icon="/hamburger-menu.svg" />
  </div>
);
