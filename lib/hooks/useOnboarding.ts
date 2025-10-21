import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export function useOnboarding() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [fullName, setFullName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const submitOnboarding = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/api/onboarding", {
        userId: user?.id,
        fullName,
        businessName,
        industry,
        location,
        logoUrl,
      });
      return res.data;
    },
    onSuccess: () => router.push("/dashboard"),
  });

  return {
    user,
    businessName,
    setBusinessName,
    industry,
    setIndustry,
    location,
    setLocation,
    fullName,
    setFullName,
    logoUrl,
    setLogoUrl,
    submitOnboarding,
  };
}