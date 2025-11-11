import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { verifyOrgRole } from "@/lib/auth/checkRole";
import { verifyBusiness } from "@/lib/auth/checkBusiness";

export async function POST(request: NextRequest) {
  try {
    const { items, businessId, userId } = await request.json();

    if (!Array.isArray(items) || !businessId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const businessUnauthorized = await verifyBusiness(userId, businessId);
    if (businessUnauthorized) return businessUnauthorized;

    const unauthorized = await verifyOrgRole(userId);
    if (unauthorized) return unauthorized;

    for (const item of items) {
      if (!item.name || !item.categoryId) continue;
      await prisma.inventory.create({
        data: {
          name: item.name,
          quantity: item.quantity ? parseInt(item.quantity) : 0,
          categoryId: item.categoryId,
          businessId,
        },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to import inventory" },
      { status: 500 }
    );
  }
}
