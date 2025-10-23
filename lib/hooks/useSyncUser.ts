import axios from "axios";

export async function syncUserToPrisma(user: {
  id: string;
  email: string | null;
}) {
  if (!user.id || !user.email) throw new Error("Invalid user payload");

  try {
    const res = await axios.post("/api/auth/sync", {
      user: { id: user.id, email: user.email },
    });

    // Use response data directly
    return res.data;
  } catch (err: any) {
    throw new Error(
      err?.response?.data?.error || "Failed to sync user with Prisma"
    );
  }
}
