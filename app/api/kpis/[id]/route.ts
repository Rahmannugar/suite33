import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const {
      scope,
      metric,
      description,
      metricType,
      status,
      target,
      period,
      notes,
    } = await request.json();

    if (!scope || !metric) {
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
      select: {
        role: true,
        business: { select: { id: true } },
        Staff: { select: { businessId: true } },
      },
    });

    if (profile?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can update KPIs" },
        { status: 403 }
      );
    }

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    if (scope === "STAFF") {
      const existingKPI = await prisma.staffKPI.findUnique({
        where: { id: context.params.id },
        include: { staff: true },
      });

      if (!existingKPI || existingKPI.staff.businessId !== businessId) {
        return NextResponse.json({ error: "KPI not found" }, { status: 404 });
      }

      const kpi = await prisma.staffKPI.update({
        where: { id: context.params.id },
        data: {
          metric,
          description,
          metricType: metricType || "number",
          status: status || existingKPI.status,
          target: target ? parseFloat(target) : null,
          ...(period && { period: new Date(period) }),
          notes,
        },
        include: { staff: { include: { user: true } } },
      });

      return NextResponse.json({ kpi });
    }

    if (scope === "DEPARTMENT") {
      const existingKPI = await prisma.departmentKPI.findUnique({
        where: { id: context.params.id },
      });

      if (!existingKPI || existingKPI.businessId !== businessId) {
        return NextResponse.json({ error: "KPI not found" }, { status: 404 });
      }

      const kpi = await prisma.departmentKPI.update({
        where: { id: context.params.id },
        data: {
          metric,
          description,
          metricType: metricType || "number",
          status: status || existingKPI.status,
          target: target ? parseFloat(target) : null,
          ...(period && { period: new Date(period) }),
          notes,
        },
        include: { department: true },
      });

      return NextResponse.json({ kpi });
    }

    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  } catch (error) {
    console.error("KPI update error:", error);
    return NextResponse.json(
      { error: "Failed to update KPI" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");

    if (!scope) {
      return NextResponse.json(
        { error: "Missing scope parameter" },
        { status: 400 }
      );
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

    if (profile?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can delete KPIs" },
        { status: 403 }
      );
    }

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    if (scope === "STAFF") {
      const existingKPI = await prisma.staffKPI.findUnique({
        where: { id: context.params.id },
        include: { staff: true },
      });

      if (!existingKPI || existingKPI.staff.businessId !== businessId) {
        return NextResponse.json({ error: "KPI not found" }, { status: 404 });
      }

      await prisma.staffKPI.update({
        where: { id: context.params.id },
        data: { deletedAt: new Date() },
      });

      return NextResponse.json({ success: true });
    }

    if (scope === "DEPARTMENT") {
      const existingKPI = await prisma.departmentKPI.findUnique({
        where: { id: context.params.id },
      });

      if (!existingKPI || existingKPI.businessId !== businessId) {
        return NextResponse.json({ error: "KPI not found" }, { status: 404 });
      }

      await prisma.departmentKPI.update({
        where: { id: context.params.id },
        data: { deletedAt: new Date() },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  } catch (error) {
    console.error("KPI deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete KPI" },
      { status: 500 }
    );
  }
}
