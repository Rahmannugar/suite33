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
    if (error || !data?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { business: true, Staff: { select: { businessId: true } } },
    });

    const businessId = profile?.business?.id || profile?.Staff?.businessId;
    if (!businessId)
      return NextResponse.json({ error: "No business found" }, { status: 403 });

    const categories = await prisma.category.findMany({
      where: { businessId },
      include: { _count: { select: { inventory: true } } },
      orderBy: [{ inventory: { _count: "desc" } }, { createdAt: "desc" }],
      skip,
      take: perPage,
    });

    const total = await prisma.category.count({ where: { businessId } });

    return NextResponse.json({
      categories,
      pagination: { total, page, perPage },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { business: true, Staff: { select: { businessId: true } } },
    });

    if (profile?.role !== "ADMIN" && profile?.role !== "SUB_ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const businessId = profile?.business?.id || profile?.Staff?.businessId;
    if (!businessId)
      return NextResponse.json({ error: "No business found" }, { status: 403 });

    const normalizedName = name.trim().toLowerCase();

    const existing = await prisma.category.findFirst({
      where: { name: normalizedName, businessId },
    });

    if (existing) return NextResponse.json({ category: existing });

    const category = await prisma.category.create({
      data: { name: normalizedName, businessId },
    });

    return NextResponse.json({ category });
  } catch {
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
