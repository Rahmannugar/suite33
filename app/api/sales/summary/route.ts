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
      const sales = await prisma.sale.findMany({
        where: {
          businessId,
          date: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0, 23, 59, 59, 999),
          },
        },
      });

      return NextResponse.json({ summary: sales });
    } else {
      const sales = await prisma.sale.findMany({
        where: {
          businessId,
          date: {
            gte: new Date(year, 0, 1),
            lte: new Date(year, 11, 31, 23, 59, 59, 999),
          },
        },
      });

      type Sale = (typeof sales)[number];

      const summary = Array.from({ length: 12 }, (_, i) => {
        const monthSales = sales.filter(
          (s: Sale) => new Date(s.date).getMonth() === i
        );

        return {
          month: i + 1,
          total: monthSales.reduce((sum: number, s: Sale) => sum + s.amount, 0),
          count: monthSales.length,
        };
      });

      return NextResponse.json({ summary });
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch sales summary" },
      { status: 500 }
    );
  }
}
