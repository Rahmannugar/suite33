"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import { ThemeToggle } from "@/components/Toggler";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { validateEmail, validatePassword } from "@/lib/utils/validation";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, handleGooglePostRedirect } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
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

    if (!valid) return;

    signIn.mutate(
      { email, password },
      {
        onSuccess: () => {
          toast.success("Sign in successful!");
          router.push("/dashboard");
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-xl border border-[--border] bg-[--card] text-[--card-foreground] shadow-sm p-8">
        {/* Suite33 Logo */}
        <ThemeToggle />
        <div className="flex justify-center mb-6">
          <Image
            src="/images/suite33-black.png"
            alt="Suite33 Logo"
            width={75}
            height={75}
            className="dark:hidden"
            priority
          />
          <Image
            src="/images/suite33-white.png"
            alt="Suite33 Dark Logo"
            width={75}
            height={75}
            className="hidden dark:block"
            priority
          />
        </div>

        <h1 className="text-2xl font-semibold text-center mb-1">
          Sign in to <span className="text-[--primary]">Suite33</span>
        </h1>
        <p className="text-sm text-[--muted-foreground] text-center mb-8">
          Manage your business smarter, not harder.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          {emailError && (
            <p className="text-xs text-red-500 mt-1">{emailError}</p>
          )}
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
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[--muted-foreground] hover:text-blue-600 transition"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {passwordError && (
            <p className="text-xs text-red-500 mt-1">{passwordError}</p>
          )}

          {signIn.isError && (
            <p className="text-sm text-red-500">
              {(signIn.error as Error)?.message ?? "Something went wrong"}
            </p>
          )}

          <button
            type="submit"
            className={`w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition ${
              signIn.isPending
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            disabled={signIn.isPending}
          >
            {signIn.isPending ? (
              <Loader2 className="animate-spin mx-auto" size={18} />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <button
          onClick={() => signInWithGoogle.mutate({})}
          disabled={signInWithGoogle.isPending}
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
            ? "Redirecting..."
            : "Continue with Google"}
        </button>

        <p className="mt-6 text-sm text-[--muted-foreground] text-center">
          No account?{" "}
          <Link
            href="/auth/signup"
            className="underline text-[--primary] hover:opacity-80"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
