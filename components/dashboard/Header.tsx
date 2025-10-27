"use client";

import { ThemeToggle } from "@/components/Toggler";
import { useAuthStore } from "@/lib/stores/authStore";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
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

  // Close dropdown on click outside
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
      className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3 border-b border-[--border] bg-[--card] shadow-sm"
      style={{ background: "var(--card, #fff)" }}
    >
      <div />
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 rounded-full border border-[--input] bg-blue-50 dark:bg-blue-900/40 px-2 py-1 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-label="Profile menu"
            style={{ minWidth: 36, minHeight: 36 }}
          >
            {user?.avatarUrl ? (
              <img
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
            <ChevronDown size={16} />
          </button>
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-44 rounded-xl border border-[--border] bg-[--card] shadow-xl z-10"
              style={{ background: "var(--card, #fff)" }}
            >
              <ul className="py-2">
                <li>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-800 transition rounded-lg"
                    onClick={handleEditProfile}
                    type="button"
                  >
                    Edit Profile
                  </button>
                </li>
                <li>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-800 text-red-600 transition rounded-lg"
                    onClick={handleLogout}
                    type="button"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
