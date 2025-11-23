import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function PUT(req: NextRequest) {
  try {
    const {
      id,
      metric,
      description,
      metricType,
      target,
      status,
      period,
      notes,
    } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing KPI id" }, { status: 400 });
    }

    const updated = await prisma.staffKPI.update({
      where: { id },
      data: { metric, description, metricType, target, status, period, notes },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("STAFF KPI UPDATE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update KPI" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing KPI id" }, { status: 400 });
    }

    await prisma.staffKPI.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("STAFF KPI DELETE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete KPI" },
      { status: 500 }
    );
  }
}
