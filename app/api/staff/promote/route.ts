import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { staffId, role } = await request.json();
    if (!staffId || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: true },
    });
    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }
    await prisma.user.update({
      where: { id: staff.userId },
      data: { role },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to promote staff" },
      { status: 500 }
    );
  }
}
