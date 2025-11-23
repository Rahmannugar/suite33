import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: {
        Staff: true,
        business: true,
      },
    });

    if (!profile || profile.deletedAt) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId =
      profile.business?.id || profile.Staff?.businessId || null;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;

    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");
    const search = searchParams.get("search") || "";
    const statusParam = searchParams.get("status") || "all";
    const departmentParam = searchParams.get("departmentId") || "all";
    const period = searchParams.get("period") || "";

    const where: any = {
      businessId,
      deletedAt: null,
    };

    if (search) {
      where.metric = { contains: search, mode: "insensitive" };
    }

    if (statusParam && statusParam !== "all") {
      where.status = statusParam;
    }

    if (departmentParam && departmentParam !== "all") {
      where.departmentId = departmentParam;
    }

    if (period) {
      const date = new Date(period);
      if (!isNaN(date.getTime())) {
        where.period = {
          gte: new Date(date.getFullYear(), date.getMonth(), 1),
          lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
        };
      }
    }

    const total = await prisma.departmentKPI.count({ where });

    const dataList = await prisma.departmentKPI.findMany({
      where,
      orderBy: { period: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        department: true,
      },
    });

    return NextResponse.json({
      data: dataList,
      total,
      page,
      perPage,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch department KPIs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      departmentId,
      metric,
      description,
      metricType,
      status,
      target,
      period,
      notes,
    } = body;

    if (!departmentId || !metric || !period) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

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

    const businessId = profile.business?.id;
    if (!businessId) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department || department.businessId !== businessId) {
      return NextResponse.json(
        { error: "Invalid department" },
        { status: 400 }
      );
    }

    const datePeriod = new Date(period);
    if (isNaN(datePeriod.getTime())) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }

    const exists = await prisma.departmentKPI.findFirst({
      where: {
        departmentId,
        metric,
        period: datePeriod,
        deletedAt: null,
      },
    });

    if (exists) {
      return NextResponse.json(
        { error: "KPI already exists" },
        { status: 409 }
      );
    }

    const kpi = await prisma.departmentKPI.create({
      data: {
        businessId,
        departmentId,
        metric,
        description: description || null,
        metricType: metricType || "number",
        status: status || "PENDING",
        target: target ?? null,
        period: datePeriod,
        notes: notes || null,
      },
      include: {
        department: true,
      },
    });

    return NextResponse.json({ kpi });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create department KPI" },
      { status: 500 }
    );
  }
}
