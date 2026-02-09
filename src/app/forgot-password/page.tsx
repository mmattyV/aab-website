"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/lib/actions";
import { ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    undefined
  );

  const isSuccess = state?.message?.includes("If an account exists");

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex overflow-hidden flex-col py-64 bg-black max-md:py-24">
        <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-white max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
          FORGOT PASSWORD
        </div>
      </div>

      {/* Form */}
      <div className="relative w-full flex flex-col items-center">
        {/* Negative margin to move the form up into header space */}
        <div className="mt-[-5rem] px-4 max-w-lg mx-auto w-full">
          <form
            action={formAction}
            className="flex flex-col w-full bg-white text-black rounded-md p-10 max-md:p-6 shadow-lg"
          >
            <p className="mb-6 text-gray-700 text-sm">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            <label htmlFor="email" className="mb-2 font-semibold text-lg">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              className="rounded-md border border-gray-300 p-2 mb-6 focus:outline-none focus:ring-2 focus:ring-brandRed"
              required
              disabled={isPending}
            />

            <button
              type="submit"
              aria-disabled={isPending}
              disabled={isPending}
              className="bg-brandRed text-white py-2 rounded-md font-semibold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Sending..." : "Send Reset Link"}
            </button>

            <div
              className="flex h-auto items-start space-x-1 mt-4"
              aria-live="polite"
              aria-atomic="true"
            >
              {state?.message && (
                <>
                  {isSuccess ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <p
                    className={`text-sm ${
                      isSuccess ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {state.message}
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link
                href="/login"
                className="text-sm text-brandRed hover:underline"
              >
                ← Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
