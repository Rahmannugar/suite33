import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { fullName, businessName, industry, location, logoUrl } =
      await request.json();

    if (!businessName || !fullName) {
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

    const existingProfile = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { business: true },
    });

    if (existingProfile?.business) {
      return NextResponse.json(
        { error: "Business already exists" },
        { status: 409 }
      );
    }

    const user = await prisma.user.update({
      where: { id: data.user.id },
      data: {
        fullName,
        avatarUrl: logoUrl,
        business: {
          create: {
            name: businessName,
            industry,
            location,
            logoUrl,
          },
        },
      },
      include: { business: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
