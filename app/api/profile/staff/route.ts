import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

export async function PUT(request: NextRequest) {
  try {
    const { userId, fullName, avatarUrl } = await request.json();
    if (!userId || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { fullName, avatarUrl },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update staff profile" },
      { status: 500 }
    );
  }
}
