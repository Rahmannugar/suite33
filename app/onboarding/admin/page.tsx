"use client";

import { ThemeToggle } from "@/components/Toggler";
import { useAuthStore } from "@/lib/stores/authStore";
import { useMutation } from "@tanstack/react-query";
import { uploadAvatar } from "@/lib/utils/uploadImage";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [fullName, setFullName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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
        logoUrl = await uploadAvatar(logoFile, user.id);
      }
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

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-lg rounded-2xl border border-[--border] bg-[--card] text-[--card-foreground] shadow-lg p-8 relative">
        {/*Suite33 Logo */}
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
          Welcome, <span className="text-[--primary]">{user.email}</span>
        </h1>
        <p className="text-sm text-[--muted-foreground] text-center mb-8">
          Let’s set up your business profile.
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
              Your Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Jane Doe"
              value={fullName}
              required
              onChange={(e) => setFullName(e.target.value)}
              className="block w-full rounded-lg border border-[--input] bg-[--background] p-3 focus:ring-2 focus:ring-[--ring] outline-none transition text-base"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[--muted-foreground]">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Corp"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="block w-full rounded-lg border border-[--input] bg-[--background] p-3 focus:ring-2 focus:ring-[--ring] outline-none transition text-base"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="block text-sm font-medium text-[--muted-foreground]">
                Industry <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Retail"
                value={industry}
                required
                onChange={(e) => setIndustry(e.target.value)}
                className="block w-full rounded-lg border border-[--input] bg-[--background] p-3 focus:ring-2 focus:ring-[--ring] outline-none transition text-base"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="block text-sm font-medium text-[--muted-foreground]">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Lagos, Nigeria"
                value={location}
                required
                onChange={(e) => setLocation(e.target.value)}
                className="block w-full rounded-lg border border-[--input] bg-[--background] p-3 focus:ring-2 focus:ring-[--ring] outline-none transition text-base"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[--muted-foreground]">
              Business Logo{" "}
              <span className="text-xs text-[--muted-foreground]">
                (optional)
              </span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="block w-full rounded-lg border border-[--input] bg-transparent p-3 text-sm cursor-pointer file:bg-[--muted] file:border-0 file:rounded-md file:px-3 file:py-2 file:mr-2"
            />
            {logoPreview && (
              <div className="flex justify-center mt-2">
                <Image
                  src={logoPreview}
                  alt="Logo Preview"
                  width={96}
                  height={96}
                  className="rounded-full object-cover border border-[--border]"
                  style={{ width: "96px", height: "96px" }}
                  unoptimized
                  priority
                />
              </div>
            )}
          </div>
          <button
            type="submit"
            className={`w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition ${
              submitOnboarding.isPending
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            disabled={submitOnboarding.isPending}
          >
            {submitOnboarding.isPending ? "Setting up..." : "Finish Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
