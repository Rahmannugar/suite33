"use client";

import { ThemeToggle } from "@/components/Toggler";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useInvite } from "@/lib/hooks/useInvite";
import { useEffect, useState } from "react";

export default function AcceptInvitePage() {
  const {
    invite,
    isLoading,
    isError,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    passwordError,
    signupMutation,
  } = useInvite();

  const [dots, setDots] = useState(1);

  useEffect(() => {
    if (isLoading || !invite) {
      const interval = setInterval(() => {
        setDots((d) => (d === 3 ? 1 : d + 1));
      }, 400);
      return () => clearInterval(interval);
    } else {
      setDots(1);
    }
  }, [isLoading, invite]);

  if (isLoading || !invite)
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <h1 className="text-lg font-semibold mb-2">
          Verifying your invitation
          <span aria-live="polite" className="inline-block w-6">
            {".".repeat(dots)}
          </span>
        </h1>
      </div>
    );

  if (isError)
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <p className="text-red-500">Invalid or expired invitation link.</p>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-[--border] bg-[--card] text-[--card-foreground] shadow-sm p-8">
        <ThemeToggle />
        <div className="flex justify-center mb-6">
          <Image
            src="/images/suite33-black.png"
            alt="Suite33 Logo"
            width={60}
            height={60}
            className="dark:hidden"
            priority
          />
          <Image
            src="/images/suite33-white.png"
            alt="Suite33 Dark Logo"
            width={60}
            height={60}
            className="hidden dark:block"
            priority
          />
        </div>
        <h1 className="text-2xl font-semibold text-center mb-1">
          Join <span className="text-[--primary]">{invite.business.name}</span>
        </h1>
        <p className="text-sm text-[--muted-foreground] text-center mb-8">
          Set your password to join the team.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            signupMutation.mutate();
          }}
          className="space-y-4"
        >
          <input
            type="email"
            value={invite.email}
            readOnly
            className="block w-full rounded-lg border border-[--input] bg-muted p-3 text-base"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Set your password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-[--ring] outline-none transition pr-10 text-base"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[--muted-foreground] hover:text-blue-600 transition"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {passwordError && (
            <p className="text-xs text-red-500 mt-1">{passwordError}</p>
          )}
          {signupMutation.isError && (
            <p className="text-sm text-red-500">
              {(signupMutation.error as Error)?.message ?? "Signup failed"}
            </p>
          )}
          <button
            type="submit"
            className={`w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition ${
              signupMutation.isPending
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending ? "Joining..." : "Join Business"}
          </button>
        </form>
      </div>
    </div>
  );
}
