"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/Toggler";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#process", label: "How it works" },
  { href: "/#testimonials", label: "Testimonials" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut.mutateAsync();
    router.push("/auth/login");
  };

  // Close navbar on scroll (allow scroll instead of locking it)
  useEffect(() => {
    const handleScroll = () => {
      if (open) setOpen(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [open]);

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur">
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-2 py-2 hover:text-blue-600 font-medium transition"
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 text-white px-4 py-2 font-semibold shadow hover:bg-red-700 active:scale-95 transition"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-2 py-2 hover:text-blue-600 font-medium transition"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-md bg-blue-600 text-white px-4 py-2 font-semibold shadow hover:bg-blue-700 active:scale-95 transition"
              >
                Join
              </Link>
            </>
          )}

          <ThemeToggle />
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="p-2 rounded-md border border-[--border] bg-inherit flex items-center justify-center"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.button
              type="button"
              aria-label="Close menu"
              className="md:hidden fixed inset-0 z-30 bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Menu Items */}
            <motion.nav
              id="mobile-menu"
              className="md:hidden absolute top-16 left-0 w-full z-40 border-b border-[--border] shadow-lg"
              style={{
                background: "var(--card, #fff)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "tween", duration: 0.18, ease: "easeOut" }}
            >
              <ul className="flex flex-col divide-y divide-[--border]">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block px-6 py-3 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-[0.99] transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}

                {user ? (
                  <li>
                    <button
                      onClick={() => {
                        setOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-6 py-3 font-semibold bg-red-600 text-white hover:bg-red-700 active:scale-[0.99] transition"
                    >
                      Logout
                    </button>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link
                        href="/auth/login"
                        onClick={() => setOpen(false)}
                        className="block px-6 py-3 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-[0.99] transition"
                      >
                        Sign In
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/auth/signup"
                        onClick={() => setOpen(false)}
                        className="block px-6 py-3 font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] transition"
                      >
                        Join
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
