import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
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

    const expenditures = await prisma.expenditure.findMany({
      where: { businessId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ expenditures });
  } catch (error) {
    console.error("Expenditures fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenditures" },
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
        { error: "Only admins and sub-admins can add expenditures" },
        { status: 403 }
      );
    }

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    const expenditure = await prisma.expenditure.create({
      data: {
        amount,
        description,
        businessId,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json({ expenditure });
  } catch (error) {
    console.error("Expenditure creation error:", error);
    return NextResponse.json(
      { error: "Failed to add expenditure" },
      { status: 500 }
    );
  }
}
