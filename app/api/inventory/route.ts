import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { verifyOrgRole } from "@/lib/auth/checkRole";
import { verifyBusiness } from "@/lib/auth/checkBusiness";

export async function GET(request: NextRequest) {
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
    const inventory = await prisma.inventory.findMany({
      where: { businessId },
      include: { category: true },
    });
    return NextResponse.json({ inventory });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, quantity, categoryId, businessId, userId } =
      await request.json();

    if (!name || !categoryId || !businessId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const businessUnauthorized = await verifyBusiness(userId, businessId);
    if (businessUnauthorized) return businessUnauthorized;

    const unauthorized = await verifyOrgRole(userId);
    if (unauthorized) return unauthorized;

    const item = await prisma.inventory.create({
      data: { name, quantity, categoryId, businessId },
    });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add inventory" },
      { status: 500 }
    );
  }
}
