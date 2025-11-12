import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { amount, description, date } = await request.json();

    if (!amount || !description) {
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

    if (profile?.role !== "ADMIN" && profile?.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    const existingExpenditure = await prisma.expenditure.findUnique({
      where: { id: context.params.id },
    });

    if (!existingExpenditure || existingExpenditure.businessId !== businessId) {
      return NextResponse.json(
        { error: "Expenditure not found" },
        { status: 404 }
      );
    }

    const expenditure = await prisma.expenditure.update({
      where: { id: context.params.id },
      data: { amount, description, date: date ? new Date(date) : undefined },
    });

    return NextResponse.json({ expenditure });
  } catch (error) {
    console.error("Expenditure update error:", error);
    return NextResponse.json(
      { error: "Failed to update expenditure" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
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

    if (profile?.role !== "ADMIN" && profile?.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    const existingExpenditure = await prisma.expenditure.findUnique({
      where: { id: context.params.id },
    });

    if (!existingExpenditure || existingExpenditure.businessId !== businessId) {
      return NextResponse.json(
        { error: "Expenditure not found" },
        { status: 404 }
      );
    }

    await prisma.expenditure.delete({ where: { id: context.params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Expenditure deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete expenditure" },
      { status: 500 }
    );
  }
}
