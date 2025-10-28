"use client";

import { ThemeToggle } from "@/components/Toggler";
import { useAuthStore } from "@/lib/stores/authStore";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

function getInitials(name: string | null | undefined) {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const { signOut } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  // Close dropdown when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (dropdownOpen) setDropdownOpen(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    await signOut.mutateAsync();
    router.push("/auth/login");
  };

  const handleEditProfile = () => {
    router.push("/dashboard/edit-profile");
    setDropdownOpen(false);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 flex items-center justify-end px-6 py-3 border-b border-[--border] bg-[--card] shadow-sm"
      style={{ background: "var(--card, #fff)" }}
    >
      <div />
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 cursor-pointer rounded-full border border-[--input] bg-blue-50 dark:bg-blue-900/40 px-2 py-[6px] hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all duration-200 ease-in-out hover:scale-[1.03]"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-label="Profile menu"
            style={{ minWidth: 36, minHeight: 36 }}
          >
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt="Avatar"
                width={28}
                height={28}
                className="rounded-full object-cover w-7 h-7"
              />
            ) : (
              <span className="inline-flex items-center justify-center rounded-full w-7 h-7 font-bold text-white bg-blue-600">
                {getInitials(user?.fullName)}
              </span>
            )}
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Animated Dropdown */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                className="absolute right-0 mt-2 w-52 rounded-2xl bg-[--card] shadow-xl border border-[--border] z-10 overflow-hidden"
                style={{ background: "var(--card, #fff)" }}
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ type: "tween", duration: 0.18, ease: "easeOut" }}
              >
                <ul className="flex flex-col">
                  <li>
                    <button
                      className="w-full text-left px-5 py-2.5 cursor-pointer font-medium transition-all duration-150 hover:bg-blue-50 dark:hover:bg-blue-900/40"
                      onClick={handleEditProfile}
                      type="button"
                    >
                      Edit Profile
                    </button>
                  </li>
                  <li className="border-t border-[--border]" />
                  <li>
                    <button
                      className="w-full text-left px-5 py-2.5 cursor-pointer font-medium text-red-600 transition-all duration-150 hover:bg-red-50 dark:hover:bg-red-500/30"
                      onClick={handleLogout}
                      type="button"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
