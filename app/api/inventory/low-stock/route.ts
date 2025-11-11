import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { verifyBusiness } from "@/lib/auth/checkBusiness";

export async function GET(request: NextRequest) {
  const threshold = 5;
  const businessId = request.nextUrl.searchParams.get("businessId");
  const userId = request.nextUrl.searchParams.get("userId");

  if (!businessId || !userId) {
    return NextResponse.json(
      { error: "Missing businessId or userId" },
      { status: 400 }
    );
  }

  const businessUnauthorized = await verifyBusiness(userId, businessId);
  if (businessUnauthorized) return businessUnauthorized;

  try {
    const lowStock = await prisma.inventory.findMany({
      where: {
        businessId,
        quantity: { lt: threshold },
      },
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
