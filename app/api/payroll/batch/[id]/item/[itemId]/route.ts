import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string; itemId: string } }
) {
  try {
    const { id, itemId } = context.params;
    const { amount, paid } = await request.json();

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

    const businessId = profile.business?.id || profile.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 400 }
      );
    }

    const batch = await prisma.payrollBatch.findUnique({
      where: { id },
      select: { id: true, businessId: true, deletedAt: true },
    });

    if (!batch || batch.deletedAt || batch.businessId !== businessId) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const item = await prisma.payrollBatchItem.findUnique({
      where: { id: itemId },
      select: { staffId: true, deletedAt: true },
    });

    if (!item || item.deletedAt) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (profile.role === "STAFF" || profile.role === "SUB_ADMIN") {
      if (item.staffId !== profile.Staff?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updated = await prisma.payrollBatchItem.update({
      where: { id: itemId },
      data: {
        amount: amount ?? undefined,
        paid: paid ?? undefined,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update payroll item" },
      { status: 500 }
    );
  }
}
