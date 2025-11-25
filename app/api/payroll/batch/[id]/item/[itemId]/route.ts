import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: { id: string; itemId: string } }
) {
  try {
    const { id, itemId } = context.params;

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
    if (!profile)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const businessId = profile.business?.id || profile.Staff?.businessId || "";

    const item = await prisma.payrollBatchItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        staffId: true,
        amount: true,
        paid: true,
        batch: { select: { id: true, businessId: true, period: true } },
        staff: {
          select: {
            id: true,
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    if (!item || item.batch.businessId !== businessId) {
      return NextResponse.json(
        { error: "Payroll item not found" },
        { status: 404 }
      );
    }

    if (profile.role === "ADMIN") {
      return NextResponse.json(item);
    }

    if (profile.role === "SUB_ADMIN" || profile.role === "STAFF") {
      if (item.staffId !== profile.Staff?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json({
        id: item.id,
        amount: item.amount,
        paid: item.paid,
        period: item.batch.period,
      });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch payroll item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string; itemId: string } }
) {
  try {
    const { itemId } = context.params;
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
        Staff: { select: { id: true, businessId: true } },
      },
    });
    if (!profile)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const businessId = profile.business?.id || profile.Staff?.businessId || "";

    const item = await prisma.payrollBatchItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        staffId: true,
        batch: { select: { businessId: true } },
      },
    });

    if (!item || item.batch.businessId !== businessId) {
      return NextResponse.json(
        { error: "Payroll item not found" },
        { status: 404 }
      );
    }

    if (profile.role === "ADMIN") {
      const updated = await prisma.payrollBatchItem.update({
        where: { id: itemId },
        data: {
          amount: body.amount,
          paid: body.paid,
        },
      });
      return NextResponse.json(updated);
    }

    if (profile.role === "SUB_ADMIN") {
      if (item.staffId !== profile.Staff?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const updated = await prisma.payrollBatchItem.update({
        where: { id: itemId },
        data: { amount: body.amount },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch {
    return NextResponse.json(
      { error: "Failed to update payroll item" },
      { status: 500 }
    );
  }
}
