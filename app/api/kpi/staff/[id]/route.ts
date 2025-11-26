import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: {
        role: true,
        business: { select: { id: true } },
        Staff: { select: { businessId: true } },
      },
    });

    if (profile?.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const businessId = profile.business?.id || profile.Staff?.businessId;

    const existing = await prisma.staffKPI.findUnique({
      where: { id },
      select: {
        id: true,
        staff: {
          select: {
            businessId: true,
          },
        },
      },
    });

    if (!existing || existing.staff.businessId !== businessId)
      return NextResponse.json({ error: "KPI not found" }, { status: 404 });

    const updated = await prisma.staffKPI.update({
      where: { id },
      data: {
        metric: body.metric,
        description: body.description || null,
        metricType: body.metricType,
        target: body.target ?? null,
        status: body.status,
        period: body.period,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { error: "Failed to update KPI" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: {
        role: true,
        business: { select: { id: true } },
        Staff: { select: { businessId: true } },
      },
    });

    if (profile?.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const businessId = profile.business?.id || profile.Staff?.businessId;

    const existing = await prisma.staffKPI.findUnique({
      where: { id },
      select: {
        id: true,
        staff: {
          select: { businessId: true },
        },
      },
    });

    if (!existing || existing.staff.businessId !== businessId)
      return NextResponse.json({ error: "KPI not found" }, { status: 404 });

    await prisma.staffKPI.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete KPI" },
      { status: 500 }
    );
  }
}
