"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useMutation } from "@tanstack/react-query";
import { uploadAvatar } from "@/lib/utils/uploadImage";
import { ThemeToggle } from "@/components/Toggler";
import Image from "next/image";
import axios from "axios";
import { Upload, RefreshCw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminOnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [businessName, setBusinessName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const completeOnboarding = useMutation({
    mutationFn: async () => {
      let logoUrl = null;
      if (file && user?.id) {
        logoUrl = await uploadAvatar(file, user.id);
      }

      await axios.post("/api/onboarding/admin", {
        userId: user?.id,
        businessName,
        logoUrl,
      });
    },
    onSuccess: () => {
      toast.success("Onboarding complete!");
      setIsRouting(true);
      router.push("/dashboard/admin");
    },
  });

  useEffect(() => {
    if (user?.role === "ADMIN" && user?.businessId) {
      window.location.href = "/dashboard/admin";
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-[--border] bg-[--card] text-[--card-foreground] shadow-sm p-8">
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
        <h1 className="text-2xl font-semibold text-center mb-1">
          Welcome to <span className="text-[--primary]">Suite33</span>
        </h1>
        <p className="text-sm text-[--muted-foreground] text-center mb-8">
          Let’s set up your business.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            completeOnboarding.mutate();
          }}
          className="space-y-5"
        >
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
              className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition pr-10"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[--muted-foreground]">
              Business Logo{" "}
              <span className="text-[--muted-foreground]">(optional)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => document.getElementById("logo-upload")?.click()}
                className="p-2 rounded-full border border-[--input] bg-[--card] hover:bg-[--muted] transition"
                aria-label={
                  preview ? "Replace business logo" : "Upload business logo"
                }
              >
                {preview ? <RefreshCw size={20} /> : <Upload size={20} />}
              </button>
              {preview && (
                <Image
                  src={preview}
                  alt="Preview"
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

          {completeOnboarding.isError && (
            <p className="text-sm text-red-500 text-center">
              {(completeOnboarding.error as Error)?.message ??
                "Failed to complete onboarding"}
            </p>
          )}

          <button
            type="submit"
            className={`w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition ${
              completeOnboarding.isPending || isRouting
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            disabled={completeOnboarding.isPending || isRouting}
          >
            {completeOnboarding.isPending || isRouting ? (
              <Loader2 className="animate-spin mx-auto" size={18} />
            ) : (
              "Continue to Dashboard"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
