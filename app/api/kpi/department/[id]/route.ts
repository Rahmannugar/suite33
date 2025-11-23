import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      metric,
      description,
      metricType,
      status,
      target,
      period,
      notes,
    } = body;

    if (!id || !metric || !period)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const supabase = await supabaseServer(true);
    const { data: auth, error } = await supabase.auth.getUser();

    if (error || !auth?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: { business: true },
    });

    if (!profile || profile.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const businessId = profile.business?.id;

    const existing = await prisma.departmentKPI.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!existing || existing.deletedAt)
      return NextResponse.json({ error: "KPI not found" }, { status: 404 });

    if (existing.businessId !== businessId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const datePeriod = new Date(period);
    if (isNaN(datePeriod.getTime()))
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });

    const conflict = await prisma.departmentKPI.findFirst({
      where: {
        departmentId: existing.departmentId,
        metric,
        period: datePeriod,
        deletedAt: null,
        NOT: { id },
      },
    });

    if (conflict)
      return NextResponse.json(
        { error: "KPI already exists for this period" },
        { status: 409 }
      );

    const updated = await prisma.departmentKPI.update({
      where: { id },
      data: {
        metric,
        description: description || null,
        metricType: metricType || "number",
        status: status || existing.status,
        target: target ?? null,
        period: datePeriod,
        notes: notes || null,
      },
      include: { department: true },
    });

    return NextResponse.json({ kpi: updated });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to update KPI" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await supabaseServer(true);
    const { data: auth, error } = await supabase.auth.getUser();

    if (error || !auth?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: { business: true },
    });

    if (!profile || profile.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const businessId = profile.business?.id;

    const existing = await prisma.departmentKPI.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!existing || existing.deletedAt)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (existing.businessId !== businessId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.departmentKPI.update({
      where: { id },
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
