import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
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

    const where: any = { businessId };

    if (year) {
      const y = Number(year);
      where.date = {
        gte: new Date(y, 0, 1),
        lte: new Date(y, 11, 31, 23, 59, 59, 999),
      };
    }

    if (month && year) {
      const y = Number(year);
      const m = Number(month) - 1;
      where.date = {
        gte: new Date(y, m, 1),
        lte: new Date(y, m + 1, 0, 23, 59, 59, 999),
      };
    }

    if (search) {
      where.description = { contains: search, mode: "insensitive" };
    }

    const [expenditures, total] = await Promise.all([
      prisma.expenditure.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: perPage,
      }),
      prisma.expenditure.count({ where }),
    ]);

    return NextResponse.json({
      expenditures,
      pagination: { total, page, perPage },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch expenditures" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { amount, description, date } = await request.json();
    if (!amount || !description)
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

    const expenditure = await prisma.expenditure.create({
      data: {
        amount,
        description,
        businessId,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json({ expenditure });
  } catch {
    return NextResponse.json(
      { error: "Failed to add expenditure" },
      { status: 500 }
    );
  }
}
