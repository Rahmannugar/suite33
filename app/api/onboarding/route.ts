import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fullName, businessName, industry, location, logoUrl } =
      body;

    if (!userId || !businessName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update user details and create business
    const user = await prisma.user.update({
      where: { id: userId },
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
    console.error("Onboarding Error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
