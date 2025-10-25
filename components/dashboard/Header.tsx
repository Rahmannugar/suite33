"use client";

import Image from "next/image";
import { ThemeToggle } from "@/components/Toggler";
import { useAuthStore } from "@/lib/stores/authStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

function getInitials(name: string | null | undefined, role: string) {
  if (!name) return "";
  if (role === "ADMIN") {
    return name.charAt(0).toUpperCase();
  }
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

  const handleLogout = async () => {
    await signOut.mutateAsync();
    router.push("/auth/login");
  };

  const handleEditProfile = () => {
    router.push("/dashboard/staff/edit-profile");
    setDropdownOpen(false);
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-[--border] bg-[--card]">
      {/* Logo */}
      <div className="flex items-center gap-2">
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
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-full border border-[--input] bg-blue-50 dark:bg-blue-900/40 px-2 py-1"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-label="Profile menu"
          >
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt="Avatar"
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : (
              <span
                className={`inline-flex items-center justify-center rounded-full w-8 h-8 font-bold text-white ${
                  user?.role === "ADMIN" ? "bg-blue-600" : "bg-blue-500"
                }`}
              >
                {getInitials(
                  user?.role === "ADMIN" ? user?.businessName : user?.fullName,
                  user?.role ?? ""
                )}
              </span>
            )}
            <ChevronDown size={18} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-[--border] bg-[--card] shadow-lg z-10">
              <ul className="py-2">
                {(user?.role === "STAFF" || user?.role === "SUB_ADMIN") && (
                  <li>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900 transition"
                      onClick={handleEditProfile}
                    >
                      Edit Profile
                    </button>
                  </li>
                )}
                <li>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900 text-red-600 transition"
                    onClick={handleLogout}
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
