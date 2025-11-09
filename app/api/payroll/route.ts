import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

export async function GET() {
  try {
    const payroll = await prisma.payroll.findMany({
      include: {
        staff: {
          include: {
            user: true,
            department: true,
          },
        },
        business: true,
      },
    });
    return NextResponse.json({ payroll });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch payroll" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { staffId, businessId, amount, period } = await request.json();
    if (!staffId || !businessId || !amount || !period) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const payroll = await prisma.payroll.create({
      data: {
        staffId,
        businessId,
        amount,
        period: new Date(period),
      },
    });
    return NextResponse.json({ payroll });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create payroll" },
      { status: 500 }
    );
  }
}
