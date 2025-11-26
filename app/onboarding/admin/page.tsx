"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { uploadAvatar } from "@/lib/utils/uploadImage";
import Image from "next/image";
import { ThemeToggle } from "@/components/Toggler";
import {
  Building2,
  MapPin,
  Briefcase,
  User,
  RefreshCw,
  Upload,
  Loader2,
} from "lucide-react";

export default function AdminOnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.role === "ADMIN" && user?.businessId) {
      router.replace("/dashboard/admin");
    }
  }, [user, router]);

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [fullName, setFullName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const submitOnboarding = useMutation({
    mutationFn: async () => {
      let logoUrl = "";
      if (logoFile && user?.id) {
        try {
          logoUrl = await uploadAvatar(logoFile, user.id);
        } catch {
          toast.error("Failed to upload logo.");
        }
      }

      await axios.post("/api/onboarding", {
        fullName,
        businessName,
        industry,
        location,
        logoUrl,
      });
    },
    onSuccess: () => {
      setFullName("");
      setBusinessName("");
      setIndustry("");
      setLocation("");
      setLogoFile(null);
      setLogoPreview(null);
      toast.success("Business profile created! Signing you in...");
      setIsRouting(true);
      router.push("/dashboard/admin");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.error || "Failed to complete onboarding"
      );
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-7 lg:px-8 bg-background">
      <div className="w-full max-w-lg rounded-xl border border-[--border] bg-[--card] text-[--card-foreground] shadow-lg p-8 relative">
        <ThemeToggle />
        <div className="flex justify-center mb-6">
          <Image
            src="/images/suite33-black.png"
            alt="Suite33 Logo"
            width={60}
            height={60}
            className="dark:hidden"
            priority
          />
          <Image
            src="/images/suite33-white.png"
            alt="Suite33 Dark Logo"
            width={60}
            height={60}
            className="hidden dark:block"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">
          Welcome, <span className="text-[--primary]">{user?.email}</span>
        </h1>
        <p className="text-sm text-[--muted-foreground] text-center mb-8">
          Let's set up your business profile.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitOnboarding.mutate();
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[--muted-foreground]">
              <User className="inline mr-2" size={16} />
              Your Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Jane Doe"
              value={fullName}
              required
              onChange={(e) => setFullName(e.target.value)}
              className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition pr-10"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[--muted-foreground]">
              <Building2 className="inline mr-2" size={16} />
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Corp"
              value={businessName}
              required
              onChange={(e) => setBusinessName(e.target.value)}
              className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[--muted-foreground]">
              <Briefcase className="inline mr-2" size={16} />
              Industry (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Technology"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[--muted-foreground]">
              <MapPin className="inline mr-2" size={16} />
              Location (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Lagos, Nigeria"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[--muted-foreground]">
              Business Logo{" "}
              <span className="text-[--muted-foreground]">(optional)</span>
            </label>

            <div className="flex items-center gap-3">
              <input
                id="admin-logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  document.getElementById("admin-logo-upload")?.click()
                }
                className="p-2 rounded-full border border-[--input] cursor-pointer bg-[--card] hover:bg-[--muted] transition"
                aria-label={
                  logoPreview ? "Replace business logo" : "Upload business logo"
                }
              >
                {logoPreview ? <RefreshCw size={20} /> : <Upload size={20} />}
              </button>

              {logoPreview && (
                <Image
                  src={logoPreview}
                  alt="Business Logo Preview"
                  width={48}
                  height={48}
                  className="rounded-full object-cover border border-[--border]"
                  style={{ width: "48px", height: "48px" }}
                  unoptimized
                  priority
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            className={`w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition ${
              submitOnboarding.isPending || isRouting
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            disabled={submitOnboarding.isPending || isRouting}
          >
            {submitOnboarding.isPending || isRouting ? (
              <Loader2 className="animate-spin mx-auto" size={18} />
            ) : (
              "Complete Setup"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
