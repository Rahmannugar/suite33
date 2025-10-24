import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { supabaseServer } from "@/lib/supabase/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const supabase = await supabaseServer(true);

    const { data, error } = await supabase.auth.getUser();
    console.log("Supabase getUser:", { data, error });
    const user = data?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile from Prisma, including staff and department for staff
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        business: {
          select: { id: true, name: true },
        },
        Staff: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: record.id,
      email: record.email,
      avatarUrl: record.avatarUrl,
      fullName: record.fullName,
      role: record.role,
      businessId: record.business?.id ?? null,
      businessName: record.business?.name ?? null,
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
