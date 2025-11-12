import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  try {
    const { fullName, avatarUrl } = await request.json();

    if (!fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
    });

    if (profile?.role !== "STAFF" && profile?.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: data.user.id },
      data: { fullName, avatarUrl },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Staff profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update staff profile" },
      { status: 500 }
    );
  }
}
