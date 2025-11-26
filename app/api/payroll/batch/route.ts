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
      select: {
        role: true,
        business: { select: { id: true } },
        Staff: { select: { businessId: true } },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = profile.business?.id || profile.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 400 }
      );
    }

    if (profile.role === "ADMIN") {
      const batches = await prisma.payrollBatch.findMany({
        where: { businessId, deletedAt: null },
        orderBy: { period: "desc" },
      });

      return NextResponse.json(batches);
    }

    const batches = await prisma.payrollBatch.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { period: "desc" },
      select: {
        id: true,
        period: true,
        locked: true,
      },
    });

    return NextResponse.json(batches);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch payroll batches" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { period } = await request.json();

    if (!period) {
      return NextResponse.json(
        { error: "Period is required" },
        { status: 400 }
      );
    }

    const normalized = new Date(
      new Date(period).getFullYear(),
      new Date(period).getMonth(),
      1
    );

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

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const businessId = profile.business?.id || profile.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 400 }
      );
    }

    const exists = await prisma.payrollBatch.findFirst({
      where: { businessId, period: normalized, deletedAt: null },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Batch already exists" },
        { status: 409 }
      );
    }

    const staffList = await prisma.staff.findMany({
      where: { businessId, deletedAt: null },
    });

    type Staff = (typeof staffList)[number];

    const batch = await prisma.payrollBatch.create({
      data: {
        businessId,
        period: normalized,
        items: {
          create: staffList.map((s: Staff) => ({
            staffId: s.id,
            amount: 0,
            paid: false,
          })),
        },
      },
    });

    return NextResponse.json(batch);
  } catch {
    return NextResponse.json(
      { error: "Failed to create payroll batch" },
      { status: 500 }
    );
  }
}
