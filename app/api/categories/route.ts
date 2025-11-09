import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

export async function POST(request: NextRequest) {
  try {
    const { name, businessId } = await request.json();
    if (!name || !businessId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: { name: name.trim().toLowerCase(), businessId },
    });
    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
  }
  try {
    const categories = await prisma.category.findMany({
      where: { businessId },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
