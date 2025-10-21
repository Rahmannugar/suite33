"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";
import { syncUserToPrisma } from "@/lib/hooks/useSyncUser";
import axios from "axios";

type Credentials = { email: string; password: string };

export function useAuth() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  async function setRoleSession(role: string) {
    await axios.post("/api/auth/session", { role });
  }

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

      const user = await syncUserToPrisma({
        id: data.user.id,
        email: data.user.email ?? null,
      });

      // Set role session cookie
      await setRoleSession(user.role);

      setUser({ id: user.id, email: user.email, role: user.role });
      return user;
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

      const user = await syncUserToPrisma({
        id: data.user.id,
        email: data.user.email ?? null,
      });

      await setRoleSession(user.role);
      setUser({ id: user.id, email: user.email, role: user.role });

      return user;
    },
  });

  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      await axios.delete("/api/auth/session");
      queryClient.removeQueries({ queryKey: ["user-profile"] });
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
