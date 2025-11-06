"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";
import axios from "axios";
import { toast } from "sonner";

export default function InviteConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [dots, setDots] = useState(1);
  const hasProcessed = useRef(false);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d === 3 ? 1 : d + 1));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function processInvite() {
      if (hasProcessed.current || !token) return;
      hasProcessed.current = true;

      try {
        const {
          data: { user },
          error,
        } = await supabaseClient.auth.getUser();

        if (error || !user) {
          toast.error("Authentication failed");
          router.push("/auth/login");
          return;
        }

        await axios.post("/api/invite/accept", {
          token,
          userId: user.id,
          email: user.email,
        });

        localStorage.removeItem("pending_invite_token");

        const { data: profile } = await axios.get("/api/user/profile");

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

        await axios.post("/api/auth/session", { role: profile.role });

        toast.success("Account verified! Complete your profile.");
        router.push("/onboarding/staff");
      } catch (error: any) {
        console.error("Error accepting invite:", error);
        localStorage.removeItem("pending_invite_token");

        if (error?.response?.status === 409) {
          toast.error("This email is already registered.");
        } else {
          toast.error(
            error?.response?.data?.error || "Failed to accept invite"
          );
        }

        router.push("/auth/login");
      }
    }

    processInvite();
  }, [token, router, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div className="space-y-3">
        <h1 className="text-lg font-semibold">
          Setting up your account
          <span aria-live="polite" className="inline-block w-6">
            {".".repeat(dots)}
          </span>
        </h1>
        <p className="text-sm text-[--muted-foreground]">
          Please wait while we complete your profile.
        </p>
      </div>
    </div>
  );
}
