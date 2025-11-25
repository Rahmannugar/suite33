import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";
import { slackNotify } from "@/lib/utils/slackService";

export async function POST(request: NextRequest) {
  try {
    const { fullName, avatarUrl } = await request.json();

    if (!fullName) {
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
      include: {
        Staff: {
          include: {
            business: true,
          },
        },
      },
    });

    if (profile?.role !== "STAFF" && profile?.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.update({
      where: { id: data.user.id },
      data: { fullName, avatarUrl },
    });

    const businessName = profile?.Staff?.business?.name ?? "";
    await slackNotify(
      "onboarding-staff",
      `${fullName}, ${user.email} just joined ${businessName} - Staff onboarding`
    );

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Staff onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to complete staff onboarding" },
      { status: 500 }
    );
  }
}
