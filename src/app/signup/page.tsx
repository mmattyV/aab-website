"use client";

import Link from "next/link";

export default function SignUpLandingPage() {
  return (
    <div className="flex overflow-hidden flex-col py-64 bg-black max-md:py-24">
      {/* Page Title */}
      <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-white max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
        SIGN UP
      </div>

      {/* Additional Info and Buttons Section */}
      <div className="flex flex-col items-center px-14 pt-12 pb-32 bg-black max-md:px-5 max-md:pb-16">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brother Sign-Up Info */}
          <div className="flex flex-col justify-between bg-gray-900 p-8 rounded-md shadow-lg">
            <div>
              <h3 className="text-3xl font-semibold mb-4">
                Sign Up as Brother
              </h3>
              <p className="text-lg mb-6">
                Become a part of our esteemed brotherhood. Gain access to
                exclusive resources, mentorship programs, and a supportive
                network to help you thrive both personally and professionally.
              </p>
            </div>
            <Link
              href="/signup/brother"
              className="px-6 py-3 bg-brandRed hover:bg-white hover:text-black transition text-white rounded-md text-lg flex items-center justify-center shadow-md"
            >
              Sign Up as Brother
            </Link>
          </div>

          {/* Recruit Sign-Up Info */}
          <div className="flex flex-col justify-between bg-gray-900 p-8 rounded-md shadow-lg">
            <div>
              <h3 className="text-3xl font-semibold mb-4">
                Sign Up as Recruit
              </h3>
              <p className="text-lg mb-6">
                Join our recruitment team and engage in various activities,
                connect with current members, and explore opportunities to
                become a part of our vibrant community.
              </p>
            </div>
            <Link
              href="/signup/recruit"
              className="px-6 py-3 bg-brandRed hover:bg-white hover:text-black transition text-white rounded-md text-lg flex items-center justify-center shadow-md"
            >
              Sign Up as Recruit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
