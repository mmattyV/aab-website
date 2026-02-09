"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PowerIcon } from "@heroicons/react/24/outline";
import { serverSignOut } from "@/app/lib/actions";
import { MenuButtonProps } from "@/app/lib/definitions";

export default function MenuButton({
  text,
  icon,
  isLoggedIn,
}: MenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      {/* Menu Button */}
      <button
        onClick={toggleMenu}
        className="flex gap-3 items-center px-5 py-4 mx-10 shadow bg-white min-h-[55px] rounded-[40px] w-[139px] max-md:px-4 max-md:w-auto max-md:mx-4"
      >
        <div className="flex items-center justify-center flex-shrink-0 w-[24px] h-[24px]">
          <Image
            src={icon}
            alt="menu icon"
            width={21}
            height={21}
            className="object-contain"
          />
        </div>
        <div className="flex-1 text-xl whitespace-nowrap text-zinc-700 max-sm:hidden">
          {text}
        </div>
      </button>

      {/* Side Navigation Bar */}
      <div
        className={`fixed top-0 right-0 h-full w-[250px] bg-neutral-900 text-white transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out z-50 shadow-lg flex flex-col`}
      >
        <button
          onClick={toggleMenu}
          className="absolute top-5 right-5 text-xl font-bold"
        >
          ✕
        </button>
        <nav className="flex flex-col mt-16 gap-4 px-6 flex-grow">
          <Link
            href="/"
            className="text-lg hover:underline"
            onClick={toggleMenu}
          >
            Home
          </Link>
          <Link
            href="/brothers"
            className="text-lg hover:underline"
            onClick={toggleMenu}
          >
            Brothers
          </Link>
          {isLoggedIn && (
            <Link
              href="/recruits"
              className="text-lg hover:underline"
              onClick={toggleMenu}
            >
              Recruits
            </Link>
          )}
          <Link
            href="/constitution"
            className="text-lg hover:underline"
            onClick={toggleMenu}
          >
            Constitution
          </Link>

          {isLoggedIn && (
            <Link
              href="/edit-profile"
              className="text-lg hover:underline"
              onClick={toggleMenu}
            >
              Edit Profile
            </Link>
          )}

          {/* Show Login & Sign Up only if NOT logged in */}
          {!isLoggedIn && (
            <>
              <Link
                href="/login"
                className="text-lg hover:underline"
                onClick={toggleMenu}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-lg hover:underline"
                onClick={toggleMenu}
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>

        {/* Sign Out Button - Pinned to the Bottom */}
        {isLoggedIn && (
          <form action={serverSignOut} className="w-full px-6 pb-6">
            <button
              className="flex gap-3 items-center px-5 py-4 shadow bg-white min-h-[55px] rounded-[40px] w-full text-xl text-zinc-700 hover:bg-gray-200 transition"
              type="submit"
            >
              <PowerIcon className="w-6 text-zinc-700" />
              <span>Sign Out</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
