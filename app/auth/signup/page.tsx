"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    signUp.mutate(
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
          Create your account
        </h1>

        <form onSubmit={handleSignup} className="mt-4 space-y-4">
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

          {signUp.isError && (
            <p className="text-sm text-red-500">
              {(signUp.error as Error)?.message ?? "Something went wrong"}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-[--primary] text-[--primary-foreground] py-2"
            disabled={signUp.isPending}
          >
            {signUp.isPending ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <GoogleButton />

        <p className="mt-4 text-sm text-[--muted-foreground] text-center">
          Already have an account?{" "}
          <a href="/auth/login" className="underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

function GoogleButton() {
  const { signInWithGoogle } = useAuth();

  return (
    <button
      onClick={() => signInWithGoogle.mutate()}
      className="mt-4 w-full rounded-md border border-[--input] py-2"
      disabled={signInWithGoogle.isPending}
    >
      {signInWithGoogle.isPending ? "Redirecting..." : "Continue with Google"}
    </button>
  );
}
