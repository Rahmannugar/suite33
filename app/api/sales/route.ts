import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const sales = await prisma.sale.findMany();
    return NextResponse.json({ sales });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { amount, description, businessId, date } = await request.json();
    if (!amount || !description || !businessId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const sale = await prisma.sale.create({
      data: {
        amount,
        description,
        businessId,
        date: date ? new Date(date) : new Date(),
      },
    });
    return NextResponse.json({ sale });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add sale" }, { status: 500 });
  }
}
