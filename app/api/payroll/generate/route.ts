import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

export async function POST(request: NextRequest) {
  try {
    const { businessId, year, month } = await request.json();
    if (!businessId || !year || !month) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const period = new Date(year, month - 1, 1);

    const staffList = await prisma.staff.findMany({ where: { businessId } });

    for (const staff of staffList) {
      const exists = await prisma.payroll.findFirst({
        where: { staffId: staff.id, period },
      });
      if (!exists) {
        await prisma.payroll.create({
          data: {
            staffId: staff.id,
            businessId,
            amount: 0,
            period,
            paid: false,
          },
        });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate payroll" },
      { status: 500 }
    );
  }
}
