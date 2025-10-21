import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { syncUserToPrisma } from "@/lib/hooks/useSyncUser";
import { useMutation } from "@tanstack/react-query";
import { useRef, useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";

export function useAuthCallback() {
  const router = useRouter();
  const triggered = useRef(false);
  const setUser = useAuthStore((s) => s.setUser);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabaseClient.auth.getUser();
      if (error || !data?.user) {
        throw new Error("Callback error");
      }
      await syncUserToPrisma({
        id: data.user.id,
        email: data.user.email ?? "",
      });
      setUser({ id: data.user.id, email: data.user.email!, role: "ADMIN" });
    },
    onSuccess: () => {
      router.replace("/onboarding");
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
