import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

export async function POST(request: NextRequest) {
  try {
    const { staffId, userId } = await request.json();
    if (!staffId || !userId) {
      return NextResponse.json(
        { error: "Missing staffId or userId" },
        { status: 400 }
      );
    }

    // Delete staff record
    await prisma.staff.delete({ where: { id: staffId } });

    // Delete user record
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fully delete user" },
      { status: 500 }
    );
  }
}
