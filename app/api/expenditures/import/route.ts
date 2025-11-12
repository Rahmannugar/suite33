import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { expenditures } = await request.json();

    if (!Array.isArray(expenditures)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
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

    if (profile?.role !== "ADMIN" && profile?.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    for (const e of expenditures) {
      if (!e.amount) continue;
      const desc =
        e.description && e.description.trim() ? e.description : "Expenditures";
      await prisma.expenditure.create({
        data: {
          amount: parseFloat(e.amount),
          description: desc,
          businessId,
          date: e.date ? new Date(e.date) : new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Expenditures import error:", error);
    return NextResponse.json(
      { error: "Failed to import expenditures" },
      { status: 500 }
    );
  }
}
