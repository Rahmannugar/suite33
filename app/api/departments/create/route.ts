import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { name, businessId } = await request.json();
    if (!name || !businessId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: { name, businessId },
    });

    return NextResponse.json({ department });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}
