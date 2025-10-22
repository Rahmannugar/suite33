"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { useMutation } from "@tanstack/react-query";
import { uploadAvatar } from "@/lib/utils/uploadImage";
import { ThemeToggle } from "@/components/Toggler";
import Image from "next/image";
import axios from "axios";

export default function StaffOnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [fullName, setFullName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const completeOnboarding = useMutation({
    mutationFn: async () => {
      let avatarUrl = null;
      if (file && user?.id) {
        avatarUrl = await uploadAvatar(file, user.id);
      }

      const res = await axios.post("/api/onboarding/staff", {
        userId: user?.id,
        fullName,
        avatarUrl,
      });

      return res.data;
    },
    onSuccess: () => router.push("/dashboard"),
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-[--border] bg-[--card] text-[--card-foreground] shadow-sm p-8">
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
          Let’s personalize your profile.
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
              Your Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="block w-full rounded-lg border border-[--input] bg-[--background] p-3 focus:ring-2 focus:ring-[--ring] outline-none transition text-base"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[--muted-foreground]">
              Profile Picture{" "}
              <span className="text-xs text-[--muted-foreground]">
                (optional)
              </span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="block w-full rounded-lg border border-[--input] bg-transparent p-3 text-sm cursor-pointer file:bg-[--muted] file:border-0 file:rounded-md file:px-3 file:py-2 file:mr-2"
            />
            {preview && (
              <div className="flex justify-center mt-2">
                <Image
                  src={preview}
                  alt="Preview"
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

          {completeOnboarding.isError && (
            <p className="text-sm text-red-500 text-center">
              {(completeOnboarding.error as Error)?.message ??
                "Failed to complete onboarding"}
            </p>
          )}

          <button
            type="submit"
            className={`w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition ${
              completeOnboarding.isPending
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            disabled={completeOnboarding.isPending}
          >
            {completeOnboarding.isPending
              ? "Saving..."
              : "Continue to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
