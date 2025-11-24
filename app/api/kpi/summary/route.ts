import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { departmentId, period } = body || {};

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

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = profile.business?.id || profile.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    let start: Date | undefined;
    let end: Date | undefined;

    if (period) {
      const base = new Date(period);
      if (!isNaN(base.getTime())) {
        start = new Date(base.getFullYear(), base.getMonth(), 1);
        end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
      }
    }

    const staffWhere: any = {
      deletedAt: null,
      staff: {
        businessId,
        deletedAt: null,
      },
    };

    const deptWhere: any = {
      deletedAt: null,
      businessId,
    };

    if (departmentId && departmentId !== "all") {
      staffWhere.staff.departmentId = departmentId;
      deptWhere.departmentId = departmentId;
    }

    if (start && end) {
      staffWhere.period = { gte: start, lt: end };
      deptWhere.period = { gte: start, lt: end };
    }

    const [staffKPIs, departmentKPIs] = await Promise.all([
      prisma.staffKPI.findMany({
        where: staffWhere,
        select: { status: true },
      }),
      prisma.departmentKPI.findMany({
        where: deptWhere,
        select: { status: true },
      }),
    ]);

    function buildSummary(list: { status: string }[]) {
      return {
        pending: list.filter((k) => k.status === "PENDING").length,
        inProgress: list.filter((k) => k.status === "IN_PROGRESS").length,
        completed: list.filter((k) => k.status === "COMPLETED").length,
        expired: list.filter((k) => k.status === "EXPIRED").length,
      };
    }

    const summary = {
      staff: buildSummary(staffKPIs),
      dept: buildSummary(departmentKPIs),
    };

    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch KPI summary" },
      { status: 500 }
    );
  }
}
