import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

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
        Staff: { select: { id: true, businessId: true } },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = profile.business?.id || profile.Staff?.businessId || "";

    const batch = await prisma.payrollBatch.findUnique({
      where: { id },
      select: {
        id: true,
        businessId: true,
        period: true,
        locked: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            staffId: true,
            amount: true,
            paid: true,
            createdAt: true,
            staff: {
              select: {
                id: true,
                user: { select: { fullName: true, email: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!batch || batch.businessId !== businessId) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if (profile.role === "ADMIN") {
      return NextResponse.json(batch);
    }

    if (profile.role === "SUB_ADMIN" || profile.role === "STAFF") {
      const ownItem = batch.items.find((i) => i.staffId === profile.Staff?.id);

      return NextResponse.json({
        id: batch.id,
        period: batch.period,
        locked: batch.locked,
        item: ownItem || null,
      });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch payroll batch" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const body = await request.json();

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

    const businessId = profile.business?.id || profile.Staff?.businessId || "";

    const existing = await prisma.payrollBatch.findUnique({
      where: { id },
      select: { id: true, businessId: true },
    });

    if (!existing || existing.businessId !== businessId) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const updated = await prisma.payrollBatch.update({
      where: { id },
      data: {
        locked: body.locked ?? undefined,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update payroll batch" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

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

    const businessId = profile.business?.id || profile.Staff?.businessId || "";

    const existing = await prisma.payrollBatch.findUnique({
      where: { id },
      select: { id: true, businessId: true },
    });

    if (!existing || existing.businessId !== businessId) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    await prisma.payrollBatchItem.deleteMany({
      where: { batchId: id },
    });

    await prisma.payrollBatch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete payroll batch" },
      { status: 500 }
    );
  }
}
