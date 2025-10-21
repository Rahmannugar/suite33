"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    signIn.mutate(
      { email, password },
      {
        onSuccess: () => {
          router.push("/dashboard");
        },
      }
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-[--border] bg-[--card] text-[--card-foreground] p-6">
        <h1 className="text-xl font-semibold text-center">
          Sign in to Suite33
        </h1>

        <form onSubmit={handleLogin} className="mt-4 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-md border border-[--input] bg-transparent p-2"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-md border border-[--input] bg-transparent p-2"
          />

          {signIn.isError && (
            <p className="text-sm text-red-500">
              {(signIn.error as Error)?.message ?? "Something went wrong"}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-[--primary] text-[--primary-foreground] py-2"
            disabled={signIn.isPending}
          >
            {signIn.isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Google Sign-In */}
        <button
          onClick={() => signInWithGoogle.mutate()}
          className="mt-4 w-full rounded-md border border-[--input] py-2"
          disabled={signInWithGoogle.isPending}
        >
          {signInWithGoogle.isPending
            ? "Redirecting..."
            : "Continue with Google"}
        </button>

        <p className="mt-4 text-sm text-[--muted-foreground] text-center">
          No account?{" "}
          <a href="/auth/signup" className="underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
