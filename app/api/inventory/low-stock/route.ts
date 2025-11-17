import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");
    const threshold = 5;
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

    const [lowStock, total] = await Promise.all([
      prisma.inventory.findMany({
        where: {
          businessId,
          quantity: { lt: threshold },
        },
        include: { category: true },
        orderBy: [{ quantity: "asc" }, { createdAt: "desc" }],
        skip,
        take: perPage,
      }),
      prisma.inventory.count({
        where: {
          businessId,
          quantity: { lt: threshold },
        },
      }),
    ]);

    return NextResponse.json({
      lowStock,
      pagination: { total, page, perPage },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch low stock items" },
      { status: 500 }
    );
  }
}
