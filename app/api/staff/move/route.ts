import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { staffId, departmentId } = await request.json();

    if (!staffId || !departmentId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: {
        role: true,
        business: { select: { id: true } },
        Staff: { select: { businessId: true } },
      },
    });

    if (profile?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff || staff.businessId !== businessId) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    await prisma.staff.update({
      where: { id: staffId },
      data: { departmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Staff move error:", error);
    return NextResponse.json(
      { error: "Failed to move staff" },
      { status: 500 }
    );
  }
}
