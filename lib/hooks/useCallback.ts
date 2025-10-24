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

      // Always sync user to Prisma
      await syncUserToPrisma({
        id: data.user.id,
        email: data.user.email ?? "",
      });

      // Fetch full profile
      const { data: profile } = await axios.get("/api/user/profile");

      // Set role cookie and Zustand from profile
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

      return profile;
    },
    onSuccess: (profile) => {
      // Use role for routing, not businessId
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
