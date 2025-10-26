import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    const { userId, fullName, logoUrl } = await request.json();
    if (!userId || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update admin full name
    await prisma.user.update({
      where: { id: userId },
      data: { fullName },
    });

    // Update business logo if provided
    if (logoUrl) {
      await prisma.business.update({
        where: { ownerId: userId },
        data: { logoUrl },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update admin profile" },
      { status: 500 }
    );
  }
}
