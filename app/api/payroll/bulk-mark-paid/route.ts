import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

export async function POST(request: NextRequest) {
  try {
    const { departmentId, year, month } = await request.json();
    if (!departmentId || !year || !month) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const period = new Date(year, month - 1, 1);

    const staffList = await prisma.staff.findMany({ where: { departmentId } });
    const staffIds = staffList.map((s: any) => s.id);

    await prisma.payroll.updateMany({
      where: {
        staffId: { in: staffIds },
        period,
      },
      data: { paid: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to bulk mark payroll as paid" },
      { status: 500 }
    );
  }
}
