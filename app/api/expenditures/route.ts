import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

export async function GET() {
  try {
    const expenditures = await prisma.expenditure.findMany();
    return NextResponse.json({ expenditures });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch expenditures" },
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
    const expenditure = await prisma.expenditure.create({
      data: {
        amount,
        description,
        businessId,
        date: date ? new Date(date) : new Date(),
      },
    });
    return NextResponse.json({ expenditure });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add expenditure" },
      { status: 500 }
    );
  }
}
