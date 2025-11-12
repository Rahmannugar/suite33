import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { departmentId, year, month } = await request.json();

    if (!departmentId || !year || !month) {
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

    const period = new Date(year, month - 1, 1);

    const staffList = await prisma.staff.findMany({
      where: { departmentId, businessId },
    });
    const staffIds = staffList.map((s) => s.id);

    await prisma.payroll.updateMany({
      where: {
        staffId: { in: staffIds },
        period,
      },
      data: { paid: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bulk mark paid error:", error);
    return NextResponse.json(
      { error: "Failed to bulk mark payroll as paid" },
      { status: 500 }
    );
  }
}
