"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/Toggler";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[--border] backdrop-blur supports-[backdrop-filter]:bg-[--background]/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/suite33-black.png"
            alt="Suite33"
            width={30}
            height={30}
            className="dark:hidden"
            priority
          />
          <Image
            src="/images/suite33-white.png"
            alt="Suite33"
            width={30}
            height={30}
            className="hidden dark:block"
            priority
          />
          <span className="text-lg font-semibold">Suite33</span>
        </Link>

        {/* Navigation + Toggler (visible everywhere) */}
        <div className="flex items-center gap-5">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="hover:opacity-80">
              Features
            </a>
            <Link href="/auth/login" className="hover:opacity-80">
              Sign In
            </Link>
            <Link href="/auth/signup" className="hover:opacity-80">
              Get Started
            </Link>
          </nav>

          {/* Always visible toggler */}
          <ThemeToggle />

          {/* Mobile button */}
          <div className="md:hidden">
            <Link
              href="/auth/signup"
              className="rounded-md bg-[--primary] text-[--primary-foreground] px-3 py-2 text-sm font-medium hover:opacity-90 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
