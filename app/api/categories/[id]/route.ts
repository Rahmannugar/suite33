import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { verifyOrgRole } from "@/lib/auth/checkRole";
import { verifyBusiness } from "@/lib/auth/checkBusiness";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { name, userId, businessId } = await request.json();

    if (!name || !userId || !businessId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const businessUnauthorized = await verifyBusiness(userId, businessId);
    if (businessUnauthorized) return businessUnauthorized;

    const unauthorized = await verifyOrgRole(userId);
    if (unauthorized) return unauthorized;

    const category = await prisma.category.update({
      where: { id: context.params.id },
      data: { name: name.trim().toLowerCase() },
    });
    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId, businessId } = await request.json();

    if (!userId || !businessId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const businessUnauthorized = await verifyBusiness(userId, businessId);
    if (businessUnauthorized) return businessUnauthorized;

    const unauthorized = await verifyOrgRole(userId);
    if (unauthorized) return unauthorized;

    const items = await prisma.inventory.findMany({
      where: { categoryId: context.params.id },
      select: { id: true },
    });
    if (items.length > 0) {
      return NextResponse.json(
        { error: "Category in use by existing items" },
        { status: 400 }
      );
    }
    await prisma.category.delete({ where: { id: context.params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
