import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const skip = (page - 1) * perPage;

    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: {
        business: true,
        Staff: { select: { businessId: true } },
      },
    });

    const businessId = profile?.business?.id || profile?.Staff?.businessId;
    if (!businessId)
      return NextResponse.json({ error: "No business found" }, { status: 403 });

    const where: any = { businessId };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        include: {
          staff: {
            include: { user: true },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: perPage,
      }),

      prisma.department.count({ where }),
    ]);

    return NextResponse.json({
      departments,
      pagination: {
        total,
        page,
        perPage,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name) {
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

    if (profile?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    const normalizedName = name.trim().toLowerCase();

    const existing = await prisma.department.findFirst({
      where: {
        name: normalizedName,
        businessId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Department with this name already exists" },
        { status: 409 }
      );
    }

    const department = await prisma.department.create({
      data: { name: normalizedName, businessId },
    });

    return NextResponse.json({ department });
  } catch (error) {
    console.error("Department creation error:", error);
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}
