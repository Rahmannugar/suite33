"use client";

import { useState } from "react";
import { toast } from "sonner";
import { validatePassword } from "@/lib/utils/validation";
import Image from "next/image";
import { ThemeToggle } from "@/components/Toggler";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function ResetPasswordPage() {
  const { getResetSession, resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validatePassword(password)) {
      setPasswordError(
        "Password must be at least 8 characters, include uppercase, lowercase, number, and symbol."
      );
      return;
    }
    setPasswordError("");

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }
    setConfirmPasswordError("");

    resetPassword.mutate(
      { password },
      {
        onSuccess: () => {
          toast.success("Password reset successful! Please sign in.");
          router.push("/auth/login");
        },
      }
    );
  }

  if (getResetSession.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[--muted-foreground]">Verifying link...</p>
      </div>
    );
  }

  if (getResetSession.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500">
            Invalid or expired reset link. Please request a new one.
          </p>
        </div>
      </div>
    );
  }

  const email = getResetSession.data?.email;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-xl border border-[--border] bg-[--card] text-[--card-foreground] shadow-sm p-8">
        <ThemeToggle />

        <div className="flex justify-center mb-6">
          <Logo />
        </div>

        <h1 className="text-2xl font-semibold text-center mb-1">
          Reset your password
        </h1>
        <p className="text-sm text-[--muted-foreground] text-center mb-8">
          Enter your new password for <b>{email}</b>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              type="email"
              value={email}
              readOnly
              className="block w-full rounded-lg border border-[--input] bg-muted p-3 text-base cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && (
              <div className="text-xs text-red-500">{passwordError}</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                required
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPasswordError && (
              <div className="text-xs text-red-500">{confirmPasswordError}</div>
            )}
          </div>

          {resetPassword.isError && (
            <div className="text-xs text-red-500">
              {resetPassword.error?.message || "Failed to reset password"}
            </div>
          )}

          <button
            type="submit"
            className={`w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition ${
              resetPassword.isPending
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            disabled={resetPassword.isPending}
          >
            {resetPassword.isPending ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}
