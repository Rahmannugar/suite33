import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") || `${new Date().getFullYear()}`
    );
    const month = searchParams.get("month")
      ? parseInt(searchParams.get("month")!)
      : undefined;

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

    if (month) {
      const expenditures = await prisma.expenditure.findMany({
        where: {
          businessId,
          date: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0, 23, 59, 59, 999),
          },
        },
      });
      return NextResponse.json({ summary: expenditures });
    } else {
      const expenditures = await prisma.expenditure.findMany({
        where: {
          businessId,
          date: {
            gte: new Date(year, 0, 1),
            lte: new Date(year, 11, 31, 23, 59, 59, 999),
          },
        },
      });

      const summary = Array.from({ length: 12 }, (_, i) => {
        const monthExpenditures = expenditures.filter(
          (e) => new Date(e.date).getMonth() === i
        );
        return {
          month: i + 1,
          total: monthExpenditures.reduce((sum, e) => sum + e.amount, 0),
          count: monthExpenditures.length,
        };
      });

      return NextResponse.json({ summary });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch expenditures summary" },
      { status: 500 }
    );
  }
}
