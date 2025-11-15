import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");
    const skip = (page - 1) * perPage;

    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: {
        business: true,
        Staff: {
          select: {
            id: true,
            businessId: true,
            departmentId: true,
          },
        },
      },
    });

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    const [staffKPIs, staffTotal, deptKPIs, deptTotal] = await Promise.all([
      prisma.staffKPI.findMany({
        where: {
          staff: { businessId },
          deletedAt: null,
        },
        include: { staff: { include: { user: true } } },
        orderBy: { period: "desc" },
        skip,
        take: perPage,
      }),
      prisma.staffKPI.count({
        where: {
          staff: { businessId },
          deletedAt: null,
        },
      }),
      prisma.departmentKPI.findMany({
        where: {
          businessId,
          deletedAt: null,
        },
        include: { department: true },
        orderBy: { period: "desc" },
        skip,
        take: perPage,
      }),
      prisma.departmentKPI.count({
        where: {
          businessId,
          deletedAt: null,
        },
      }),
    ]);

    let myKPIs: any = [];
    let myDeptKPIs: any = [];

    if (profile?.role === "STAFF" || profile?.role === "SUB_ADMIN") {
      if (profile.Staff?.id) {
        myKPIs = await prisma.staffKPI.findMany({
          where: {
            staffId: profile.Staff.id,
            deletedAt: null,
          },
          include: { staff: { include: { user: true } } },
          orderBy: { period: "desc" },
        });
      }

      if (profile.Staff?.departmentId) {
        myDeptKPIs = await prisma.departmentKPI.findMany({
          where: {
            departmentId: profile.Staff.departmentId,
            deletedAt: null,
          },
          include: { department: true },
          orderBy: { period: "desc" },
        });
      }
    }

    return NextResponse.json({
      kpis: {
        staff: staffKPIs,
        department: deptKPIs,
      },
      pagination: {
        staffTotal,
        deptTotal,
        page,
        perPage,
      },
      myKPIs: {
        staff: myKPIs,
        department: myDeptKPIs,
      },
    });
  } catch (error) {
    console.error("KPI fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPIs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      scope,
      scopeId,
      metric,
      description,
      metricType,
      status,
      target,
      period,
      notes,
    } = await request.json();

    if (!scope || !scopeId || !metric || !period) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "EXPIRED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    if (target !== undefined && target !== null) {
      const parsedTarget = parseFloat(target);
      if (isNaN(parsedTarget) || parsedTarget < 0) {
        return NextResponse.json(
          { error: "Target must be a positive number" },
          { status: 400 }
        );
      }
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

    if (profile?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can create KPIs" },
        { status: 403 }
      );
    }

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    const periodDate = new Date(period);

    if (scope === "STAFF") {
      const staff = await prisma.staff.findUnique({
        where: { id: scopeId },
        select: { businessId: true },
      });

      if (!staff || staff.businessId !== businessId) {
        return NextResponse.json({ error: "Staff not found" }, { status: 404 });
      }

      const existing = await prisma.staffKPI.findFirst({
        where: {
          staffId: scopeId,
          metric,
          period: periodDate,
          deletedAt: null,
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            error: "KPI already exists for this staff, metric, and period",
            suggestion: "Update the existing KPI instead",
            existingId: existing.id,
          },
          { status: 409 }
        );
      }

      const kpi = await prisma.staffKPI.create({
        data: {
          staffId: scopeId,
          metric,
          description,
          metricType: metricType || "number",
          status: status || "PENDING",
          target: target ? parseFloat(target) : null,
          period: periodDate,
          notes,
        },
        include: { staff: { include: { user: true } } },
      });

      return NextResponse.json({ kpi });
    }

    if (scope === "DEPARTMENT") {
      const department = await prisma.department.findUnique({
        where: { id: scopeId },
        select: { businessId: true },
      });

      if (!department || department.businessId !== businessId) {
        return NextResponse.json(
          { error: "Department not found" },
          { status: 404 }
        );
      }

      const existing = await prisma.departmentKPI.findFirst({
        where: {
          departmentId: scopeId,
          metric,
          period: periodDate,
          deletedAt: null,
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            error: "KPI already exists for this department, metric, and period",
            suggestion: "Update the existing KPI instead",
            existingId: existing.id,
          },
          { status: 409 }
        );
      }

      const kpi = await prisma.departmentKPI.create({
        data: {
          departmentId: scopeId,
          businessId,
          metric,
          description,
          metricType: metricType || "number",
          status: status || "PENDING",
          target: target ? parseFloat(target) : null,
          period: periodDate,
          notes,
        },
        include: { department: true },
      });

      return NextResponse.json({ kpi });
    }

    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  } catch (error) {
    console.error("KPI creation error:", error);
    return NextResponse.json(
      { error: "Failed to create KPI" },
      { status: 500 }
    );
  }
}
