import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { verifyOrgRole } from "@/lib/auth/checkRole";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { name, userId } = await request.json();
    const unauthorized = await verifyOrgRole(userId);
    if (unauthorized) return unauthorized;

    if (!name)
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    const category = await prisma.category.update({
      where: { id: context.params.id },
      data: { name: name.trim().toLowerCase() },
    });
    return NextResponse.json({ category });
  } catch {
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
    const { userId } = await request.json();
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
  } catch {
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
