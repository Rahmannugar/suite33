import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  try {
    const { businessId, industry } = await request.json();

    if (!businessId || !industry) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
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

    if (profile?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.business?.id || profile.business.id !== businessId) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const business = await prisma.business.update({
      where: { id: businessId },
      data: { industry },
    });

    return NextResponse.json({ business });
  } catch (error) {
    console.error("Business industry update error:", error);
    return NextResponse.json(
      { error: "Failed to update business industry" },
      { status: 500 }
    );
  }
}
