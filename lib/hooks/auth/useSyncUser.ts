import axios from "axios";

export async function syncUserToPrisma(user: {
  id: string;
  email: string | null;
  role?: "ADMIN" | "STAFF" | "SUB_ADMIN";
}) {
  if (!user.id || !user.email) throw new Error("Invalid user payload");

  try {
    const res = await axios.post("/api/auth/sync", {
      user: { id: user.id, email: user.email },
      role: user.role,
    });

    return res.data;
  } catch (err: any) {
    throw new Error(
      err?.response?.data?.error || "Something went wrong"
    );
  }
}
