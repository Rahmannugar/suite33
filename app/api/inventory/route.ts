import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      include: { category: true },
    });
    return NextResponse.json({ inventory });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, quantity, categoryId, businessId } = await request.json();
    if (!name || !categoryId || !businessId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const item = await prisma.inventory.create({
      data: { name, quantity, categoryId, businessId },
    });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add inventory" },
      { status: 500 }
    );
  }
}
