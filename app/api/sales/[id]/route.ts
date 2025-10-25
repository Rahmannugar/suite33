import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { amount, description, date } = await req.json();
    const sale = await prisma.sale.update({
      where: { id: params.id },
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
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.sale.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete sale" },
      { status: 500 }
    );
  }
}
