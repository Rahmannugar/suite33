"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/Toggler";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#process", label: "How it works" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/auth/login", label: "Sign In" },
  { href: "/auth/signup", label: "Sign Up" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-[--border] backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center border-b border-[--border] justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/suite33-black.png"
            alt="Suite33 Logo"
            width={90}
            height={90}
            className="dark:hidden rounded-lg"
            priority
          />
          <Image
            src="/images/suite33-white.png"
            alt="Suite33 Logo Dark"
            width={70}
            height={70}
            className="hidden dark:block rounded-lg"
            priority
          />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.href}
                href={link.href}
                className={
                  link.label === "Sign Up" || link.label === "Get Started"
                    ? "rounded-md bg-blue-600 text-white px-4 py-2 font-semibold shadow hover:bg-blue-700 active:scale-95 transition"
                    : "px-2 py-2 hover:text-blue-600 font-medium transition"
                }
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="px-2 py-2 hover:text-blue-600 font-medium transition"
              >
                {link.label}
              </a>
            )
          )}
          <ThemeToggle />
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="p-2 rounded-md border border-[--border] bg-inherit flex items-center justify-center"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          className="md:hidden absolute top-16 left-0 w-full border-b border-[--border] shadow-lg"
          style={{
            background: "var(--card, #fff)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div className="flex flex-col gap-2 px-6 py-4">
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    link.label === "Sign Up" || link.label === "Get Started"
                      ? "rounded-md bg-blue-600 text-white px-4 py-2 font-semibold shadow hover:bg-blue-700 active:scale-95 transition"
                      : "px-2 py-2 hover:text-blue-600 font-medium transition"
                  }
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-2 py-2 hover:text-blue-600 font-medium transition"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              )
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
