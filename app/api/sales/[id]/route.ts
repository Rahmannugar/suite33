import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { amount, description, date } = await request.json();
    if (!amount || !description) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const sale = await prisma.sale.update({
      where: { id: context.params.id },
      data: { amount, description, date: date ? new Date(date) : undefined },
    });
    return NextResponse.json({ sale });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update sale" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await prisma.sale.delete({ where: { id: context.params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete sale" },
      { status: 500 }
    );
  }
}
