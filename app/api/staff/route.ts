import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      include: {
        user: true,
        department: true,
      },
    });
    return NextResponse.json({ staff });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}
