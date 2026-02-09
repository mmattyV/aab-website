"use client";

import { useActionState } from "react";
import { authenticate } from "@/app/lib/actions";
import { useSearchParams } from "next/navigation";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex overflow-hidden flex-col py-64 bg-black max-md:py-24">
        <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-white max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
          LOG IN
        </div>
      </div>

      {/* Login Form: larger & moved up */}
      <div className="relative w-full flex flex-col items-center">
        {/* Negative margin to move the form up into header space */}
        <div className="mt-[-5rem] px-4 max-w-lg mx-auto w-full">
          <form
            action={formAction}
            className="flex flex-col w-full bg-white text-black rounded-md p-10 max-md:p-6 shadow-lg"
          >
            <label htmlFor="email" className="mb-2 font-semibold text-lg">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
              required
            />

            <label htmlFor="password" className="mb-2 font-semibold text-lg">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="********"
              className="rounded-md border border-gray-300 p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-brandRed"
              required
              minLength={6}
            />

            <div className="mb-6 text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-gray-600 hover:text-brandRed transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <input type="hidden" name="redirectTo" value={callbackUrl} />
            <button
              aria-disabled={isPending}
              className="bg-brandRed text-white py-2 rounded-md font-semibold hover:bg-black transition-colors"
            >
              Log In
            </button>
            <div
              className="flex h-8 items-end space-x-1"
              aria-live="polite"
              aria-atomic="true"
            >
              {errorMessage && (
                <>
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-500">{errorMessage}</p>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
