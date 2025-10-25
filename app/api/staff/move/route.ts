import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { staffId, departmentId } = await req.json();
    if (!staffId || !departmentId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    await prisma.staff.update({
      where: { id: staffId },
      data: { departmentId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to move staff" },
      { status: 500 }
    );
  }
}
