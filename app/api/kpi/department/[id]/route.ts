import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      metric,
      description,
      metricType,
      status,
      target,
      period,
      notes,
      departmentId,
    } = body;

    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { business: true },
    });

    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const kpi = await prisma.departmentKPI.findUnique({
      where: { id: params.id },
    });

    if (!kpi || kpi.deletedAt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (profile.business?.id !== kpi.businessId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let datePeriod: Date | undefined = undefined;

    if (period) {
      const d = new Date(period);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid period" }, { status: 400 });
      }
      datePeriod = d;
    }

    if (departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (!dept || dept.businessId !== kpi.businessId) {
        return NextResponse.json(
          { error: "Invalid department" },
          { status: 400 }
        );
      }
    }

    if (metric || period) {
      const exists = await prisma.departmentKPI.findFirst({
        where: {
          id: { not: kpi.id },
          departmentId: departmentId || kpi.departmentId,
          metric: metric || kpi.metric,
          period: datePeriod || kpi.period,
          deletedAt: null,
        },
      });

      if (exists) {
        return NextResponse.json(
          { error: "KPI already exists" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.departmentKPI.update({
      where: { id: params.id },
      data: {
        metric: metric ?? kpi.metric,
        description: description ?? kpi.description,
        metricType: metricType ?? kpi.metricType,
        status: status ?? kpi.status,
        target: target ?? kpi.target,
        period: datePeriod ?? kpi.period,
        notes: notes ?? kpi.notes,
        departmentId: departmentId ?? kpi.departmentId,
      },
      include: {
        department: true,
      },
    });

    return NextResponse.json({ kpi: updated });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to update KPI" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { business: true },
    });

    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const kpi = await prisma.departmentKPI.findUnique({
      where: { id: params.id },
    });

    if (!kpi || kpi.deletedAt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (profile.business?.id !== kpi.businessId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleted = await prisma.departmentKPI.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to delete KPI" },
      { status: 500 }
    );
  }
}
