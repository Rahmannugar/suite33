import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

export async function POST(request: NextRequest) {
  try {
    const { userId, fullName, avatarUrl } = await request.json();

    if (!userId || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update user profile
    const user = await prisma.user.update({
      where: { id: userId },
      data: { fullName, avatarUrl },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Staff Onboarding Error:", error);
    return NextResponse.json(
      { error: "Failed to complete staff onboarding" },
      { status: 500 }
    );
  }
}
