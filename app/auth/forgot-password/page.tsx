"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { validateEmail } from "@/lib/utils/validation";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/Toggler";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import Logo from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateEmail(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setEmailError("");
    setIsSubmitting(true);

    try {
      const checkRes = await axios.post("/api/auth/check-user", { email });

      if (!checkRes.data.exists) {
        toast.error("No account found with this email address.");
        setIsSubmitting(false);
        return;
      }

      if (checkRes.data.provider === "google") {
        toast.error(
          "This account was created with Google. Please sign in with Google instead."
        );
        setIsSubmitting(false);
        return;
      }

      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL;

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setEmailSent(true);
      toast.success("Password reset link sent to your email!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send reset link");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-xl border border-[--border] bg-[--card] text-[--card-foreground] shadow-sm p-8">
        <ThemeToggle />

        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 mt-4 text-sm text-[--muted-foreground] hover:text-[--primary] transition mb-6"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>
        <div className="flex justify-center mb-6">
          <Logo />
        </div>

        {emailSent ? (
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-semibold">Check your email</h1>
            <p className="text-sm text-[--muted-foreground]">
              We've sent a password reset link to <b>{email}</b>. Click it to
              reset your password.
            </p>
            <p className="text-xs text-[--muted-foreground] pt-4">
              Didn't receive the email? Check your spam folder or{" "}
              <button
                onClick={() => setEmailSent(false)}
                className="text-[--primary] cursor-pointer underline hover:opacity-80"
              >
                try again
              </button>
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-center mb-1">
              Reset your password
            </h1>
            <p className="text-sm text-[--muted-foreground] text-center mb-8">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
                {emailError && (
                  <div className="text-xs text-red-500">{emailError}</div>
                )}
              </div>

              <button
                type="submit"
                className={`w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition ${
                  isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
