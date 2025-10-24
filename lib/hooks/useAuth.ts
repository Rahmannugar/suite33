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
      // Check if user exists and provider
      const checkRes = await axios.post("/api/auth/check-user", { email });
      if (checkRes.data.exists && checkRes.data.provider === "google") {
        return Promise.reject(
          new Error(
            "This email is linked to a Google account. Please sign in with Google."
          )
        );
      }

      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL;

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?action=signup`,
        },
      });

      if (error) {
        if (error.message?.toLowerCase().includes("already registered")) {
          return Promise.reject(
            new Error(
              "An account with this email already exists. Please sign in or reset your password."
            )
          );
        }
        return Promise.reject(
          new Error("Could not create account. Please try again.")
        );
      }

      if (!data.user)
        return Promise.reject(
          new Error("Signup succeeded but no user returned from Supabase")
        );

      try {
        const user = await syncUserToPrisma({
          id: data.user.id,
          email: data.user.email ?? null,
        });

        await setRoleSession(user.role);
        setUser({ id: user.id, email: user.email, role: user.role });
        return user;
      } catch (err) {
        return Promise.reject(
          new Error("Could not finish account setup. Please try again.")
        );
      }
    },
  });

  const signIn = useMutation({
    mutationFn: async ({ email, password }: Credentials) => {
      // Check if user exists and provider
      const checkRes = await axios.post("/api/auth/check-user", { email });
      if (checkRes.data.exists && checkRes.data.provider === "google") {
        return Promise.reject(
          new Error(
            "This email is linked to a Google account. Please sign in with Google."
          )
        );
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const msg = error.message?.toLowerCase();
        if (msg.includes("user not found")) {
          return Promise.reject(new Error("No account found with this email."));
        }
        if (
          msg.includes("provider") ||
          msg.includes("sign in with a provider")
        ) {
          return Promise.reject(
            new Error(
              "This email is linked to a Google account. Please sign in with Google."
            )
          );
        }
        if (msg.includes("invalid login credentials")) {
          return Promise.reject(
            new Error(
              "Incorrect password. Please try again or reset your password."
            )
          );
        }
        return Promise.reject(
          new Error("Could not sign in. Please try again.")
        );
      }

      if (!data.user)
        return Promise.reject(
          new Error("Login succeeded but no user returned")
        );

      try {
        const user = await syncUserToPrisma({
          id: data.user.id,
          email: data.user.email ?? null,
        });

        await setRoleSession(user.role);
        setUser({ id: user.id, email: user.email, role: user.role });

        return user;
      } catch (err) {
        return Promise.reject(
          new Error("Could not finish login. Please try again.")
        );
      }
    },
  });

  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await supabaseClient.auth.signOut();
      if (error) return Promise.reject(error);
      await axios.delete("/api/auth/session");
      queryClient.removeQueries({ queryKey: ["user-profile"] });
      setUser(null);
    },
  });

  const signInWithGoogle = useMutation({
    mutationFn: async ({ email }: { email?: string }) => {
        // Check if user exists and provider
      if (email) {
        const checkRes = await axios.post("/api/auth/check-user", { email });
        if (checkRes.data.exists && checkRes.data.provider === "email") {
          return Promise.reject(
            new Error(
              "This email is registered with a password. Please sign in with email and password."
            )
          );
        }
      }

      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL;

      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/auth/callback` },
      });

      if (error) return Promise.reject(error);
      return data;
    },
  });

  return { signUp, signIn, signOut, signInWithGoogle };
}
