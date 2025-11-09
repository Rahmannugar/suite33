import { NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        staff: {
          include: {
            user: true,
          },
        },
      },
    });
    return NextResponse.json({ departments });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}
