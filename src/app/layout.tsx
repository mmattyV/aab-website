import "@/app/ui/globals.css";
import { questrial } from "@/app/ui/fonts";
import { Header } from "@/app/ui/components/Header";
import { Footer } from "@/app/ui/components/Footer";
import { Suspense } from "react";
import Loading from "@/app/ui/components/Loading";
import { Metadata } from "next";

// 1. Declare your metadata object
export const metadata: Metadata = {
  title: {
    default: "AAB",
    template: "%s | AAB",
  },
  description: "Official Harvard AAB website built with Next.js and React.",
  keywords: ["AAB", "Harvard", "Asian", "American", "Brotherhood"],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${questrial.className} antialiased bg-white text-black`}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex flex-col flex-grow">
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </main>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-center w-full bg-white mt-5 mb-10">
          <Footer
            year={new Date().getFullYear()}
            logo="/aablogowhite.png"
            icon="/email-w-icon.svg"
          />
        </footer>
      </body>
    </html>
  );
}
