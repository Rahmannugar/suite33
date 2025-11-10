import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name } = await request.json();
    if (!name)
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    const category = await prisma.category.update({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const items = await prisma.inventory.findMany({
      where: { categoryId: params.id },
      select: { id: true },
    });
    if (items.length > 0) {
      return NextResponse.json(
        { error: "Category in use by existing items" },
        { status: 400 }
      );
    }
    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
