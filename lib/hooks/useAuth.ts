"use client";

import { useMutation } from "@tanstack/react-query";
import { supabaseClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";
import { syncUserToPrisma } from "@/lib/hooks/useSyncUser";

type Credentials = { email: string; password: string };

export function useAuth() {
  const setUser = useAuthStore((s) => s.setUser);

  const signUp = useMutation({
    mutationFn: async ({ email, password }: Credentials) => {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL;

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) throw error;
      if (!data.user)
        throw new Error("Signup succeeded but no user returned from Supabase");

      return { user: data.user };
    },
  });

  const signIn = useMutation({
    mutationFn: async ({ email, password }: Credentials) => {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error("Login succeeded but no user returned");
      await syncUserToPrisma({ id: data.user.id, email: data.user.email ?? null });
      setUser({ id: data.user.id, email: data.user.email!, role: "ADMIN" });
      return data.user;
    },
  });

  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      setUser(null);
    },
  });

  const signInWithGoogle = useMutation({
    mutationFn: async () => {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL;

      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/auth/callback` },
      });

      if (error) throw error;
      return data;
    },
  });

  return { signUp, signIn, signOut, signInWithGoogle };
}
