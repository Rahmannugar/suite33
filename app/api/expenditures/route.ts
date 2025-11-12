import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { verifyOrgRole } from "@/lib/auth/checkRole";
import { verifyBusiness } from "@/lib/auth/checkBusiness";

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId");
  const userId = request.nextUrl.searchParams.get("userId");

  if (!businessId || !userId) {
    return NextResponse.json(
      { error: "Missing businessId or userId" },
      { status: 400 }
    );
  }

  const businessUnauthorized = await verifyBusiness(userId, businessId);
  if (businessUnauthorized) return businessUnauthorized;

  try {
    const expenditures = await prisma.expenditure.findMany({
      where: { businessId },
    });
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
    const { amount, description, businessId, date, userId } =
      await request.json();

    if (!amount || !description || !businessId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const businessUnauthorized = await verifyBusiness(userId, businessId);
    if (businessUnauthorized) return businessUnauthorized;

    const unauthorized = await verifyOrgRole(userId);
    if (unauthorized) return unauthorized;

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
