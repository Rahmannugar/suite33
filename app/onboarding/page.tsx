"use client";

import { ThemeToggle } from "@/components/Toggler";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import Image from "next/image";

export default function OnboardingPage() {
  const {
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
  } = useOnboarding();

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
              Logo URL{" "}
              <span className="text-xs text-[--muted-foreground]">
                (optional)
              </span>
            </label>
            <input
              type="url"
              placeholder="Paste your logo image URL"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="block w-full rounded-lg border border-[--input] bg-[--background] p-3 focus:ring-2 focus:ring-[--ring] outline-none transition text-base"
            />
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
