"use client";

import { useActionState, useEffect, useState } from "react";
import { resetPassword, verifyResetToken } from "@/app/lib/actions";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [state, formAction, isPending] = useActionState(
    resetPassword,
    undefined
  );

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setIsValidToken(false);
        return;
      }

      const result = await verifyResetToken(token);
      setIsValidToken(result.valid);
    }

    checkToken();
  }, [token]);

  useEffect(() => {
    // Redirect to login after successful password reset
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state?.success, router]);

  // Loading state
  if (isValidToken === null) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white items-center justify-center">
        <div className="text-xl">Verifying reset link...</div>
      </div>
    );
  }

  // Invalid or expired token
  if (!isValidToken) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white">
        <div className="flex overflow-hidden flex-col py-64 bg-black max-md:py-24">
          <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-white max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
            INVALID LINK
          </div>
        </div>

        <div className="relative w-full flex flex-col items-center">
          <div className="mt-[-5rem] px-4 max-w-lg mx-auto w-full">
            <div className="flex flex-col w-full bg-white text-black rounded-md p-10 max-md:p-6 shadow-lg">
              <div className="flex items-start space-x-3 mb-6">
                <ExclamationCircleIcon className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h2 className="font-semibold text-lg mb-2">
                    Invalid or Expired Reset Link
                  </h2>
                  <p className="text-gray-700 text-sm">
                    This password reset link is invalid or has expired. Password
                    reset links are only valid for 1 hour.
                  </p>
                </div>
              </div>

              <Link
                href="/forgot-password"
                className="bg-brandRed text-white py-2 px-4 rounded-md font-semibold hover:bg-black transition-colors text-center"
              >
                Request New Reset Link
              </Link>

              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="text-sm text-brandRed hover:underline"
                >
                  Back to login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (state?.success) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white">
        <div className="flex overflow-hidden flex-col py-64 bg-black max-md:py-24">
          <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-white max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
            SUCCESS!
          </div>
        </div>

        <div className="relative w-full flex flex-col items-center">
          <div className="mt-[-5rem] px-4 max-w-lg mx-auto w-full">
            <div className="flex flex-col w-full bg-white text-black rounded-md p-10 max-md:p-6 shadow-lg">
              <div className="flex items-start space-x-3 mb-6">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h2 className="font-semibold text-lg mb-2">
                    Password Reset Successful
                  </h2>
                  <p className="text-gray-700 text-sm">
                    Your password has been successfully reset. Redirecting to
                    login page...
                  </p>
                </div>
              </div>

              <Link
                href="/login"
                className="bg-brandRed text-white py-2 px-4 rounded-md font-semibold hover:bg-black transition-colors text-center"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex overflow-hidden flex-col py-64 bg-black max-md:py-24">
        <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-white max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
          RESET PASSWORD
        </div>
      </div>

      {/* Form */}
      <div className="relative w-full flex flex-col items-center">
        <div className="mt-[-5rem] px-4 max-w-lg mx-auto w-full">
          <form
            action={formAction}
            className="flex flex-col w-full bg-white text-black rounded-md p-10 max-md:p-6 shadow-lg"
          >
            <p className="mb-6 text-gray-700 text-sm">
              Enter your new password below. It must be at least 6 characters
              long.
            </p>

            <input type="hidden" name="token" value={token} />

            <label htmlFor="password" className="mb-2 font-semibold text-lg">
              New Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter new password"
              className="rounded-md border border-gray-300 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brandRed"
              required
              minLength={6}
              disabled={isPending}
            />

            <label
              htmlFor="confirmPassword"
              className="mb-2 font-semibold text-lg"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              className="rounded-md border border-gray-300 p-2 mb-6 focus:outline-none focus:ring-2 focus:ring-brandRed"
              required
              minLength={6}
              disabled={isPending}
            />

            <button
              type="submit"
              aria-disabled={isPending}
              disabled={isPending}
              className="bg-brandRed text-white py-2 rounded-md font-semibold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Resetting..." : "Reset Password"}
            </button>

            <div
              className="flex h-auto items-start space-x-1 mt-4"
              aria-live="polite"
              aria-atomic="true"
            >
              {state?.message && !state.success && (
                <>
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-500">{state.message}</p>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
