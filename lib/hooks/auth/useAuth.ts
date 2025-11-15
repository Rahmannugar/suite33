"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/authStore";
import { supabaseClient } from "@/lib/supabase/client";
import { syncUserToPrisma } from "./useSyncUser";
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

    if (profile.role === "ADMIN") {
      router.push("/dashboard/admin");
    } else if (profile.role === "STAFF" || profile.role === "SUB_ADMIN") {
      router.push("/dashboard/staff");
    } else {
      router.push("/dashboard");
    }
  }

  const signUp = useMutation({
    mutationFn: async ({
      email,
      password,
      redirectTo,
    }: Credentials & { redirectTo?: string }) => {
      const checkRes = await axios.post("/api/auth/check-user", { email });

      if (checkRes.data.exists) {
        if (checkRes.data.provider === "google") {
          throw new Error(
            "This email is registered with Google. Please sign in with Google."
          );
        }
        throw new Error(
          "An account with this email already exists. Please sign in."
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

      if (error) throw error;
      if (!data.user) throw new Error("Failed to create account");

      return data.user;
    },
  });

  const signIn = useMutation({
    mutationFn: async ({ email, password }: Credentials) => {
      const checkRes = await axios.post("/api/auth/check-user", { email });

      if (checkRes.data.exists && checkRes.data.provider === "google") {
        throw new Error(
          "This account was created with Google. Please sign in with Google instead."
        );
      }

      if (!checkRes.data.exists) {
        throw new Error("No account found with this email address.");
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Incorrect password. Please try again.");
        }
        throw error;
      }

      if (!data.user) throw new Error("Sign in failed");

      await handleProfileAndRoute(data.user.id, data.user.email ?? "");
      return data.user;
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
    mutationFn: async ({ email }: { email?: string }) => {
      if (email) {
        const checkRes = await axios.post("/api/auth/check-user", { email });
        if (checkRes.data.exists && checkRes.data.provider !== "google") {
          throw new Error(
            "This email is registered with email/password. Please sign in with email and password."
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

      if (error) throw error;
      return data;
    },
  });

  async function handleGooglePostRedirect() {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error || !data?.user) throw new Error("Authentication failed");

    await syncUserToPrisma({ id: data.user.id, email: data.user.email ?? "" });
    await handleProfileAndRoute(data.user.id, data.user.email ?? "");
  }

  const getResetSession = useQuery({
    queryKey: ["reset-session"],
    queryFn: async () => {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error || !data.session?.user?.email) {
        throw new Error("Invalid or expired reset link");
      }
      return data.session.user;
    },
    enabled: true,
  });

  const resetPassword = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      const { error } = await supabaseClient.auth.updateUser({ password });
      if (error) {
        if (error.message.includes("same_password")) {
          throw new Error(
            "New password must be different from your current password."
          );
        }
        throw error;
      }
    },
  });

  return {
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    handleGooglePostRedirect,
    getResetSession,
    resetPassword,
  };
}
