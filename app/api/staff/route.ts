import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const departmentId = searchParams.get("departmentId") || "all";

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

    if (departmentId !== "all") {
      if (departmentId === "none") where.departmentId = null;
      else where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        include: {
          user: true,
          department: true,
        },
        orderBy: {
          user: { fullName: "asc" },
        },
        skip,
        take: perPage,
      }),
      prisma.staff.count({ where }),
    ]);

    return NextResponse.json({
      staff,
      pagination: {
        total,
        page,
        perPage,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}
