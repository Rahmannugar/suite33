"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { syncUserToPrisma } from "@/lib/hooks/useSyncUser";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      const { data, error } = await supabaseClient.auth.getUser();
      if (error || !data?.user) {
        console.error("Callback error", error);
        return router.replace("/auth/login");
      }

      await syncUserToPrisma({
        id: data.user.id,
        email: data.user.email ?? "",
      });

      router.replace("/onboarding");
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-lg font-semibold mb-2">Verifying your account...</h1>
      <p className="text-sm text-[--muted-foreground]">
        Please wait a moment while we finish setting up your profile.
      </p>
    </div>
  );
}
