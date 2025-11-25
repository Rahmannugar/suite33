import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { syncUser } from "@/lib/auth/syncUser";
import { slackNotify } from "@/lib/utils/slackService";

export async function POST(request: NextRequest) {
  try {
    const { user, role } = await request.json();

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

    const syncedUser = await syncUser(user.id, user.email, role ?? "ADMIN");

    await slackNotify("signups", `${user.email} just signed up to Suite33 `);

    return NextResponse.json(syncedUser, { status: 200 });
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
