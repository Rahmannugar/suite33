import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { expenditures, businessId } = await request.json();
    if (!Array.isArray(expenditures) || !businessId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    for (const e of expenditures) {
      if (!e.amount) continue;
      await prisma.expenditure.create({
        data: {
          amount: parseFloat(e.amount),
          description: e.description,
          businessId,
          date: e.date ? new Date(e.date) : new Date(),
        },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to import expenditures" },
      { status: 500 }
    );
  }
}
