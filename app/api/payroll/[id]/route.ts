import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { amount } = await request.json();

    if (!amount) {
      return NextResponse.json({ error: "Missing amount" }, { status: 400 });
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

    const existingPayroll = await prisma.payroll.findUnique({
      where: { id: context.params.id },
    });

    if (!existingPayroll || existingPayroll.businessId !== businessId) {
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }

    const payroll = await prisma.payroll.update({
      where: { id: context.params.id },
      data: { amount },
    });

    return NextResponse.json({ payroll });
  } catch (error) {
    console.error("Payroll update error:", error);
    return NextResponse.json(
      { error: "Failed to update payroll" },
      { status: 500 }
    );
  }
}
