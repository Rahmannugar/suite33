"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { supabaseClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useProfile } from "@/lib/hooks/useProfile";
import type { User } from "@/lib/types/user";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { profile: rawProfile, isLoading: profileLoading } = useProfile();

  const profile = rawProfile as User | null;

  const { isLoading: sessionLoading } = useQuery({
    queryKey: ["app-session"],
    queryFn: async () => {
      const { data } = await supabaseClient.auth.getUser();
      const current = data?.user;

      if (!current) {
        router.replace("/auth/login");
        return null;
      }

      if (!user) {
        setUser({
          id: current.id,
          email: current.email!,
          role: (profile?.role as "ADMIN" | "STAFF") ?? "ADMIN",
          businessId: profile?.businessId ?? undefined,
        });
      }

      return current;
    },
  });

  if (sessionLoading || profileLoading)
    return (
      <div className="min-h-screen flex items-center justify-center text-[--muted-foreground]">
        Loading dashboard...
      </div>
    );

  return <>{children}</>;
}
