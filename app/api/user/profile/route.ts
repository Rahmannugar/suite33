import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const record = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        business: true,
        Staff: {
          include: {
            department: true,
            business: true,
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (record.deletedAt) {
      return NextResponse.json(
        { error: "Account has been deleted", deletedAt: record.deletedAt },
        { status: 403 }
      );
    }

    const business = record.business || record.Staff?.business;

    if (business?.deletedAt) {
      return NextResponse.json(
        { error: "Business has been deleted", deletedAt: business.deletedAt },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: record.id,
      email: record.email,
      avatarUrl: record.avatarUrl,
      fullName: record.fullName,
      role: record.role,
      businessId: business?.id ?? null,
      businessName: business?.name ?? null,
      businessLogo: business?.logoUrl ?? null,
      industry: business?.industry ?? null,
      location: business?.location ?? null,
      departmentId: record.Staff?.department?.id ?? null,
      departmentName: record.Staff?.department?.name ?? null,
    });
  } catch (error) {
    console.error("User Profile Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
