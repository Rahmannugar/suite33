import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { verifyOrgRole } from "@/lib/auth/checkRole";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { name, quantity, categoryId, userId } = await request.json();
    const unauthorized = await verifyOrgRole(userId);
    if (unauthorized) return unauthorized;

    const item = await prisma.inventory.update({
      where: { id: context.params.id },
      data: { name, quantity, categoryId },
    });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update inventory" },
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

    await prisma.inventory.delete({ where: { id: context.params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete inventory" },
      { status: 500 }
    );
  }
}
