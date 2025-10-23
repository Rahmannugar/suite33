"use client";

import { useAuthCallback } from "@/lib/hooks/useCallback";
import { useSearchParams } from "next/navigation";

export default function AuthCallback() {
  const { mutation, dots } = useAuthCallback();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");

  let heading = "Verifying your account";
  let subtext = "Please wait a moment while we finish setting up your profile.";

  if (action === "login") {
    heading = "Signing you in";
    subtext = "Welcome back! We're logging you in.";
  } else if (action === "signup") {
    heading = "Setting up your account";
    subtext = "Thanks for signing up! We're creating your profile.";
  } else if (action === "invite") {
    heading = "Accepting your invitation";
    subtext = "We're linking you to your team and business.";
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-lg font-semibold mb-2">
        {heading}
        <span aria-live="polite" className="inline-block w-6">
          {".".repeat(dots)}
        </span>
      </h1>
      <p className="text-sm text-[--muted-foreground]">{subtext}</p>
      {mutation.isError && (
        <p className="text-xs text-red-500 mt-2">
          {(mutation.error as Error)?.message ?? "Something went wrong"}
        </p>
      )}
    </div>
  );
}
