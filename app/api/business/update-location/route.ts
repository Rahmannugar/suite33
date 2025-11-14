import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  try {
    const { location } = await request.json();

    if (!location) {
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

    if (!profile.business?.id) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (profile.business?.deletedAt) {
      return NextResponse.json(
        { error: "Business is deleted" },
        { status: 410 }
      );
    }

    const business = await prisma.business.update({
      where: { id: profile.business.id },
      data: { location },
    });

    return NextResponse.json({ business });
  } catch (error) {
    console.error("Business location update error:", error);
    return NextResponse.json(
      { error: "Failed to update business location" },
      { status: 500 }
    );
  }
}
