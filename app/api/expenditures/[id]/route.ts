import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { amount, description, date } = await request.json();
    if (!amount || !description) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const expenditure = await prisma.expenditure.update({
      where: { id: context.params.id },
      data: { amount, description, date: date ? new Date(date) : undefined },
    });
    return NextResponse.json({ expenditure });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update expenditure" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await prisma.expenditure.delete({ where: { id: context.params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete expenditure" },
      { status: 500 }
    );
  }
}
