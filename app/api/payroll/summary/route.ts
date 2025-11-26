import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ summary: null }, { status: 200 });
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
      return NextResponse.json({ summary: null }, { status: 200 });
    }

    const businessId = profile.business?.id || profile.Staff?.businessId || "";

    // Fetch latest payroll batch
    const latestBatch = await prisma.payrollBatch.findFirst({
      where: {
        businessId,
        deletedAt: null,
      },
      orderBy: {
        period: "desc",
      },
      include: {
        items: {
          where: { deletedAt: null },
          include: {
            staff: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // empty summary if no batch exists
    if (!latestBatch) {
      return NextResponse.json(
        {
          summary: {
            latestPeriod: null,
            locked: false,
            totalPaid: 0,
            totalPending: 0,
            self: null,
          },
        },
        { status: 200 }
      );
    }

    const latestPeriod = latestBatch.period.toISOString();

    // ADMIN VIEW
    if (profile.role === "ADMIN") {
      const totalPaid = latestBatch.items
        .filter((i) => i.paid)
        .reduce((s, i) => s + i.amount, 0);

      const totalPending = latestBatch.items
        .filter((i) => !i.paid)
        .reduce((s, i) => s + i.amount, 0);

      return NextResponse.json({
        summary: {
          latestPeriod,
          locked: latestBatch.locked,
          totalPaid,
          totalPending,
          self: null,
        },
      });
    }

    // STAFF + SUB_ADMIN VIEW
    const staffId = profile.Staff?.id;

    const ownItem = latestBatch.items.find((i) => i.staffId === staffId);

    return NextResponse.json({
      summary: {
        latestPeriod,
        locked: latestBatch.locked,
        totalPaid: 0,
        totalPending: 0,
        self: ownItem
          ? {
              amount: ownItem.amount,
              paid: ownItem.paid,
            }
          : null,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        summary: {
          latestPeriod: null,
          locked: false,
          totalPaid: 0,
          totalPending: 0,
          self: null,
        },
      },
      { status: 200 }
    );
  }
}
