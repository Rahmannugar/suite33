import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { sales, businessId } = await req.json();
    if (!Array.isArray(sales) || !businessId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    for (const s of sales) {
      if (!s.amount) continue;
      await prisma.sale.create({
        data: {
          amount: parseFloat(s.amount),
          description: s.description,
          businessId,
          date: s.date ? new Date(s.date) : undefined,
        },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to import sales" },
      { status: 500 }
    );
  }
}
