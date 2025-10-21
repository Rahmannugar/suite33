export async function syncUserToPrisma(user: {
  id: string;
  email: string | null;
}) {
  if (!user.id || !user.email) throw new Error("Invalid user payload");

  const res = await fetch("/api/auth/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: { id: user.id, email: user.email } }),
  });

  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || "Failed to sync user with Prisma");
  }

  return res.json();
}
