import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { staffId } = await request.json();
    if (!staffId) {
      return NextResponse.json({ error: "Missing staffId" }, { status: 400 });
    }
    await prisma.staff.update({
      where: { id: staffId },
      data: { departmentId: null },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove staff from department" },
      { status: 500 }
    );
  }
}
