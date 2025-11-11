import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { verifyOrgRole } from "@/lib/auth/checkRole";
import { verifyBusiness } from "@/lib/auth/checkBusiness";

export async function POST(request: NextRequest) {
  try {
    const { name, businessId, userId } = await request.json();

    if (!name || !businessId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const businessUnauthorized = await verifyBusiness(userId, businessId);
    if (businessUnauthorized) return businessUnauthorized;

    const unauthorized = await verifyOrgRole(userId);
    if (unauthorized) return unauthorized;

    const normalizedName = name.trim().toLowerCase();

    const existing = await prisma.category.findFirst({
      where: {
        name: normalizedName,
        businessId,
      },
    });

    if (existing) {
      return NextResponse.json({ category: existing });
    }

    const category = await prisma.category.create({
      data: { name: normalizedName, businessId },
    });
    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

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
    const categories = await prisma.category.findMany({
      where: { businessId },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
