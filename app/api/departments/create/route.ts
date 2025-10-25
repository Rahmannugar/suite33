import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, businessId, headUserId } = await req.json();
    if (!name || !businessId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Create department
    const department = await prisma.department.create({
      data: { name, businessId },
    });

    // If headUserId is provided, set as department head (sub admin)
    if (headUserId) {
      await prisma.user.update({
        where: { id: headUserId },
        data: { role: "SUB_ADMIN" },
      });
      await prisma.staff.updateMany({
        where: { userId: headUserId },
        data: { departmentId: department.id },
      });
    }

    return NextResponse.json({ department });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}
