"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/auth/useAuth";
import { validateEmail, validatePassword } from "@/lib/utils/validation";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/Toggler";
import { Eye, EyeOff } from "lucide-react";
import Logo from "@/components/Logo";

export default function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;

    if (!validateEmail(email)) {
      setEmailError("Enter a valid email address.");
      valid = false;
    } else {
      setEmailError("");
    }

    if (!validatePassword(password)) {
      setPasswordError(
        "Password must be at least 8 characters, include uppercase, lowercase, number, and symbol."
      );
      valid = false;
    } else {
      setPasswordError("");
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      valid = false;
    } else {
      setConfirmPasswordError("");
    }

    if (!valid) return;

    signUp.mutate({ email, password });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-xl border border-[--border] bg-[--card] text-[--card-foreground] shadow-sm p-8">
        <ThemeToggle />
        <div className="flex justify-center mb-6">
          <Logo />
        </div>

        <h1 className="text-2xl font-semibold text-center mb-1">
          Create your <span className="text-[--primary]">Suite33</span> account
        </h1>
        <p className="text-sm text-[--muted-foreground] text-center mb-8">
          Get started managing your business in minutes.
        </p>

        {signUp.isSuccess ? (
          <div className="text-center space-y-3">
            <h2 className="text-xl font-semibold">Check your email</h2>
            <p className="text-sm text-[--muted-foreground]">
              We've sent a confirmation link to <b>{email}</b>. Click it to
              verify your account and continue.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSignup} className="space-y-4">
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

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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
                    placeholder="Confirm password"
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
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {confirmPasswordError && (
                  <div className="text-xs text-red-500">
                    {confirmPasswordError}
                  </div>
                )}
              </div>

              {signUp.isError && (
                <div className="text-xs text-red-500">
                  {signUp.error?.message || "Failed to create account"}
                </div>
              )}

              <button
                type="submit"
                className={`w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition ${
                  signUp.isPending
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                disabled={signUp.isPending}
              >
                {signUp.isPending ? "Creating account..." : "Create account"}
              </button>
            </form>

            <button
              onClick={() => signInWithGoogle.mutate({})}
              disabled={signInWithGoogle.isPending || signUp.isPending}
              className={`mt-4 w-full flex items-center justify-center gap-2 rounded-lg border border-[--input] py-3 hover:bg-blue-50 dark:hover:bg-blue-900 transition ${
                signInWithGoogle.isPending
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              <Image
                src="/icons/google.svg"
                alt="Google"
                width={18}
                height={18}
                className="opacity-90"
              />
              {signInWithGoogle.isPending
                ? "Signing up..."
                : "Continue with Google"}
            </button>
          </>
        )}

        <p className="mt-6 text-sm text-[--muted-foreground] text-center">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="underline text-[--primary] hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
