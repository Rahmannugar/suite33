import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");
    const year = searchParams.get("year");
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
        Staff: { select: { businessId: true } },
      },
    });

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    const where: any = { businessId };
    if (year) {
      where.date = {
        gte: new Date(Number(year), 0, 1),
        lte: new Date(Number(year), 11, 31, 23, 59, 59, 999),
      };
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: perPage,
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json({
      sales,
      pagination: {
        total,
        page,
        perPage,
      },
    });
  } catch (error) {
    console.error("Sales fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { amount, description, date } = await request.json();

    if (!amount || !description) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
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

    if (profile?.role !== "ADMIN" && profile?.role !== "SUB_ADMIN") {
      return NextResponse.json(
        { error: "Only admins and sub-admins can add sales" },
        { status: 403 }
      );
    }

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    const sale = await prisma.sale.create({
      data: {
        amount,
        description,
        businessId,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json({ sale });
  } catch (error) {
    console.error("Sale creation error:", error);
    return NextResponse.json({ error: "Failed to add sale" }, { status: 500 });
  }
}
