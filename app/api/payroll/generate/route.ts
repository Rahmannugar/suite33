import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { year, month } = await request.json();

    if (!year || !month) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: {
        business: true,
        Staff: { select: { businessId: true } },
      },
    });

    if (profile?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    const period = new Date(year, month - 1, 1);

    const staffList = await prisma.staff.findMany({ where: { businessId } });

    for (const staff of staffList) {
      const exists = await prisma.payroll.findFirst({
        where: { staffId: staff.id, period },
      });
      if (!exists) {
        await prisma.payroll.create({
          data: {
            staffId: staff.id,
            businessId,
            amount: 0,
            period,
            paid: false,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payroll generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate payroll" },
      { status: 500 }
    );
  }
}
