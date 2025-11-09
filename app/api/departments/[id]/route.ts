import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }
    const department = await prisma.department.update({
      where: { id: context.params.id },
      data: { name },
    });
    return NextResponse.json({ department });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update department" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await prisma.department.delete({
      where: { id: context.params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete department" },
      { status: 500 }
    );
  }
}
