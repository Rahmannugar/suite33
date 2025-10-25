import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const threshold = 5;
  try {
    const lowStock = await prisma.inventory.findMany({
      where: { quantity: { lt: threshold } },
      include: { category: true },
    });
    return NextResponse.json({ lowStock });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch low stock items" },
      { status: 500 }
    );
  }
}
