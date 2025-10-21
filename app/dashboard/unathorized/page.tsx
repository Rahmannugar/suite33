"use client";

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
      <p className="text-[--muted-foreground] mb-6">
        You don’t have permission to view this page.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 transition"
      >
        Go back to Dashboard
      </Link>
    </div>
  );
}
