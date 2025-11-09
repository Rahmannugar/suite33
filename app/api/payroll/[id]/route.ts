import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { amount } = await request.json();
    const payroll = await prisma.payroll.update({
      where: { id: context.params.id },
      data: { amount },
    });
    return NextResponse.json({ payroll });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update payroll" },
      { status: 500 }
    );
  }
}
