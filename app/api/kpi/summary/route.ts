import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { departmentId, period } = await request.json();

    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: {
        Staff: true,
        business: true,
      },
    });

    if (!profile || profile.deletedAt) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId =
      profile.business?.id || profile.Staff?.businessId || null;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    let periodFilter: any = undefined;

    if (period) {
      const date = new Date(period);
      if (!isNaN(date.getTime())) {
        periodFilter = {
          gte: new Date(date.getFullYear(), date.getMonth(), 1),
          lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
        };
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
      businessId,
      deletedAt: null,
    };

    if (departmentId && departmentId !== "all") {
      staffWhere.staff = {
        ...staffWhere.staff,
        departmentId,
      };
      deptWhere.departmentId = departmentId;
    }

    if (periodFilter) {
      staffWhere.period = periodFilter;
      deptWhere.period = periodFilter;
    }

    const staffKPIs = await prisma.staffKPI.findMany({
      where: staffWhere,
      select: {
        status: true,
      },
    });

    const deptKPIs = await prisma.departmentKPI.findMany({
      where: deptWhere,
      select: {
        status: true,
      },
    });

    const summary = {
      pending: 0,
      inProgress: 0,
      completed: 0,
      expired: 0,
    };

    [...staffKPIs, ...deptKPIs].forEach((k) => {
      if (k.status === "PENDING") summary.pending += 1;
      else if (k.status === "IN_PROGRESS") summary.inProgress += 1;
      else if (k.status === "COMPLETED") summary.completed += 1;
      else if (k.status === "EXPIRED") summary.expired += 1;
    });

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch KPI summary" },
      { status: 500 }
    );
  }
}
