import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const payroll = await prisma.payroll.update({
      where: { id: context.params.id },
      data: { paid: true },
    });
    return NextResponse.json({ payroll });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to mark payroll as paid" },
      { status: 500 }
    );
  }
}
