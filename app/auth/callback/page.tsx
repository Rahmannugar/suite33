"use client";

import { useAuthCallback } from "@/lib/hooks/useCallback";

export default function AuthCallback() {
  const { mutation, dots } = useAuthCallback();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-lg font-semibold mb-2">
        Verifying your account
        <span aria-live="polite" className="inline-block w-6">
          {".".repeat(dots)}
        </span>
      </h1>
      <p className="text-sm text-[--muted-foreground]">
        Please wait a moment while we finish setting up your profile.
      </p>

      {mutation.isError && (
        <p className="text-xs text-red-500 mt-2">
          {(mutation.error as Error)?.message ?? "Something went wrong"}
        </p>
      )}
    </div>
  );
}
