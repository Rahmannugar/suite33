import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { verifyOrgRole } from "@/lib/auth/checkRole";

export async function POST(request: NextRequest) {
  try {
    const { items, businessId, userId } = await request.json();
    const unauthorized = await verifyOrgRole(userId);
    if (unauthorized) return unauthorized;

    if (!Array.isArray(items) || !businessId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
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
