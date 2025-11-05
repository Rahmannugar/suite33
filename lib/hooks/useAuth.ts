"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";
import { syncUserToPrisma } from "@/lib/hooks/useSyncUser";
import axios from "axios";
import { useRouter } from "next/navigation";

type Credentials = { email: string; password: string };

export function useAuth() {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const router = useRouter();

  async function setRoleSession(role: string) {
    await axios.post("/api/auth/session", { role });
  }

  async function handleProfileAndRoute(userId: string, email: string) {
    await syncUserToPrisma({ id: userId, email });
    const { data: profile } = await axios.get("/api/user/profile");
    await setRoleSession(profile.role);
    setUser({
      id: profile.id,
      email: profile.email,
      role: profile.role,
      fullName: profile.fullName,
      businessId: profile.businessId,
      businessName: profile.businessName,
      avatarUrl: profile.avatarUrl,
      departmentId: profile.departmentId,
      departmentName: profile.departmentName,
    });

    // Route based on role
    if (profile.role === "ADMIN") {
      if (profile.businessId && profile.fullName) {
        router.push("/dashboard/admin");
      } else {
        router.push("/onboarding/admin");
      }
    } else if (profile.role === "STAFF" || profile.role === "SUB_ADMIN") {
      if (profile.fullName) {
        router.push("/dashboard/staff");
      } else {
        router.push("/onboarding/staff");
      }
    } else {
      router.push("/dashboard");
    }
  }

  const signUp = useMutation({
    mutationFn: async ({ 
      email, 
      password,
      redirectTo 
    }: Credentials & { redirectTo?: string }) => {
      const checkRes = await axios.post("/api/auth/check-user", { email });
      if (checkRes.data.exists && checkRes.data.provider === "google") {
        throw new Error(
          "This email is already registered with Google. Please sign in with Google instead."
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
          emailRedirectTo: redirectTo || `${origin}/onboarding/admin`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) throw new Error("Failed to create account");

      return data.user;
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

      await handleProfileAndRoute(data.user.id, data.user.email ?? "");
      return data.user;
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

      // Redirect to dashboard after Google login
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/auth/callback` },
      });

      if (error) return Promise.reject(error);
      return data;
    },
  });

  async function handleGooglePostRedirect() {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error || !data?.user) return;

    // sync user to Prisma before fetching profile
    await syncUserToPrisma({ id: data.user.id, email: data.user.email ?? "" });

    // fetch profile and set Zustand/cookie/route
    await handleProfileAndRoute(data.user.id, data.user.email ?? "");
  }

  return {
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    handleGooglePostRedirect,
  };
}
