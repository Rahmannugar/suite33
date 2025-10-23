import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { syncUserToPrisma } from "@/lib/hooks/useSyncUser";
import { useMutation } from "@tanstack/react-query";
import { useRef, useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import axios from "axios";

export function useAuthCallback() {
  const router = useRouter();
  const triggered = useRef(false);
  const setUser = useAuthStore((s) => s.setUser);

  async function setRoleSession(role: string) {
    await axios.post("/api/auth/session", { role });
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabaseClient.auth.getUser();
      if (error || !data?.user) {
        throw new Error("Callback error");
      }
      const userRecord = await syncUserToPrisma({
        id: data.user.id,
        email: data.user.email ?? "",
      });

      await setRoleSession(userRecord.role);
      setUser({
        id: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
      });

      // Fetch full profile to check onboarding status
      const { data: profile } = await axios.get("/api/user/profile");
      return profile;
    },
    onSuccess: (profile) => {
      // Redirect based on role and onboarding status
      if (profile.role === "ADMIN") {
        if (profile.businessId && profile.fullName) {
          router.replace("/dashboard/admin");
        } else {
          router.replace("/onboarding/admin");
        }
      } else if (profile.role === "STAFF") {
        if (profile.fullName) {
          router.replace("/dashboard/staff");
        } else {
          router.replace("/onboarding/staff");
        }
      } else {
        router.replace("/dashboard");
      }
    },
    onError: () => {
      router.replace("/auth/login");
    },
  });

  const [dots, setDots] = useState(1);

  useEffect(() => {
    if (mutation.isPending) {
      const interval = setInterval(() => {
        setDots((d) => (d === 3 ? 1 : d + 1));
      }, 400);
      return () => clearInterval(interval);
    } else {
      setDots(1);
    }
  }, [mutation.isPending]);

  // Trigger mutation only once, on first render
  useEffect(() => {
    if (!triggered.current) {
      triggered.current = true;
      mutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mutation, dots };
}
