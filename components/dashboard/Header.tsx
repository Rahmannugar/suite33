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
    <header className="flex items-center justify-between px-6 py-3 border-b border-[--border] bg-[--card] shadow-sm">
      <div />
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 rounded-full border border-[--input] bg-blue-50 dark:bg-blue-900/40 px-2 py-1 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-label="Profile menu"
            style={{ minWidth: 40, minHeight: 40 }}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Avatar"
                width={32}
                height={32}
                className="rounded-full object-cover w-8 h-8"
              />
            ) : (
              <span className="inline-flex items-center justify-center rounded-full w-8 h-8 font-bold text-white bg-blue-600">
                {getInitials(user?.fullName)}
              </span>
            )}
            <ChevronDown size={18} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[--border] bg-[--card] shadow-xl z-10">
              <ul className="py-2">
                <li>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition rounded-lg"
                    onClick={handleEditProfile}
                    type="button"
                  >
                    Edit Profile
                  </button>
                </li>
                <li>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-red-600 transition rounded-lg"
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
