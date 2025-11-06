"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

function useAuthCallback() {
  const { handleGooglePostRedirect } = useAuth();
  const [dots, setDots] = useState(1);
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const triggered = useRef(false);

  useEffect(() => {
    if (!triggered.current) {
      triggered.current = true;
      handleGooglePostRedirect().catch((err) => {
        setIsError(true);
        setErrorMsg(err?.message || "Something went wrong");
      });
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!isError) {
      const interval = setInterval(() => {
        setDots((d) => (d === 3 ? 1 : d + 1));
      }, 400);
      return () => clearInterval(interval);
    }
  }, [isError]);

  return { dots, isError, errorMsg };
}

export default function AuthCallbackPage() {
  const { dots, isError, errorMsg } = useAuthCallback();
  const heading = "Signing you in";
  const subtext =
    "Please wait a moment while we finish setting up your profile.";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      {!isError ? (
        <>
          <h1 className="text-lg font-semibold mb-2">
            {heading}
            <span aria-live="polite" className="inline-block w-6">
              {".".repeat(dots)}
            </span>
          </h1>
          <p className="text-sm text-[--muted-foreground]">{subtext}</p>
        </>
      ) : (
        <div className="text-center">
          <h1 className="text-lg font-semibold mb-2 text-red-600">
            Authentication Failed
          </h1>
          <p className="text-sm text-[--muted-foreground]">
            {errorMsg ?? "Something went wrong"}
          </p>
        </div>
      )}
    </div>
  );
}
