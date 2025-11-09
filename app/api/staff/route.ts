import { NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

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
