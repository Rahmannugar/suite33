import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
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

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    const payroll = await prisma.payroll.findMany({
      where: { businessId },
      include: {
        staff: {
          include: {
            user: true,
            department: true,
          },
        },
        business: true,
      },
      orderBy: { period: "desc" },
    });

    return NextResponse.json({ payroll });
  } catch (error) {
    console.error("Payroll fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payroll" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { staffId, amount, period } = await request.json();

    if (!staffId || !amount || !period) {
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

    const payroll = await prisma.payroll.create({
      data: {
        staffId,
        businessId,
        amount,
        period: new Date(period),
        paid: false,
      },
    });

    return NextResponse.json({ payroll });
  } catch (error) {
    console.error("Payroll creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payroll" },
      { status: 500 }
    );
  }
}
