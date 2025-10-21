"use client";

import { useMutation } from "@tanstack/react-query";
import { supabaseClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";
import { syncUserToPrisma } from "@/lib/hooks/useSyncUser";

type Credentials = { email: string; password: string };

export function useAuth() {
  const setUser = useAuthStore((s) => s.setUser);

  // Email + password signup
  const signUp = useMutation({
    mutationFn: async ({ email, password }: Credentials) => {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error("Signup succeeded but no user returned");
      await syncUserToPrisma({
        id: data.user.id,
        email: data.user.email ?? null,
      });
      return data.user;
    },
    onSuccess: (user) => {
      setUser({ id: user.id, email: user.email!, role: "ADMIN" });
    },
  });

  // Email + password signin
  const signIn = useMutation({
    mutationFn: async ({ email, password }: Credentials) => {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error("Login succeeded but no user returned");
      await syncUserToPrisma({
        id: data.user.id,
        email: data.user.email ?? null,
      });
      return data.user;
    },
    onSuccess: (user) => {
      setUser({ id: user.id, email: user.email!, role: "ADMIN" });
    },
  });

  // Google OAuth
  const signInWithGoogle = useMutation({
    mutationFn: async () => {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL;
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/` },
      });
      if (error) throw error;
      return data;
    },
  });

  // Sign out
  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      setUser(null);
    },
  });

  // Get session (restore user)
  const getSession = useMutation({
    mutationFn: async () => {
      const { data } = await supabaseClient.auth.getUser();
      const me = data.user;
      if (!me) {
        setUser(null);
        return null;
      }
      setUser({ id: me.id, email: me.email!, role: "ADMIN" });
      return me;
    },
  });

  return { signUp, signIn, signInWithGoogle, signOut, getSession };
}
