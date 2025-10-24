import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { syncUser } from "@/lib/auth/syncUser";

export async function POST(req: Request) {
  try {
    const { user } = await req.json();

    if (!user?.id || !user?.email) {
      return NextResponse.json(
        { error: "Invalid user payload" },
        { status: 400 }
      );
    }

    const { data: supaUser, error } =
      await supabaseAdmin.auth.admin.getUserById(user.id);
    if (error || !supaUser.user) {
      return NextResponse.json(
        { error: error?.message || "Failed to create account" },
        { status: 404 }
      );
    }

    const syncedUser = await syncUser(user.id, user.email);

    return NextResponse.json(syncedUser, { status: 200 });
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}
