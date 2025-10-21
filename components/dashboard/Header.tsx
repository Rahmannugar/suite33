"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useAuthStore } from "@/lib/stores/authStore";
import { ThemeToggle } from "@/components/Toggler";
import { LogOut } from "lucide-react";
import Image from "next/image";

export function Header() {
  const { signOut } = useAuth();
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      {/* Left: User Info */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {user?.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.fullName ?? "User Avatar"}
            width={48}
            height={48}
            className="rounded-full object-cover border border-[--border]"
          />
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[--muted] border border-[--border] text-[--muted-foreground] font-medium">
            {user?.fullName?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}

        {/* Name + Email */}
        <div>
          <h1 className="text-base md:text-lg font-semibold leading-tight">
            {user?.fullName ?? "Welcome"}
          </h1>
          {user?.email && (
            <p className="text-sm text-[--muted-foreground] truncate max-w-[180px] sm:max-w-none">
              {user.email}
            </p>
          )}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          onClick={() => signOut.mutate()}
          className="flex items-center gap-1 text-sm text-[--muted-foreground] hover:text-red-500 transition"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
