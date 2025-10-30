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

    if (logoUrl) {
      await prisma.user.update({
        where: { id: userId },
        data: { fullName, avatarUrl: logoUrl },
      });
      await prisma.business.update({
        where: { ownerId: userId },
        data: { logoUrl },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { fullName },
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
