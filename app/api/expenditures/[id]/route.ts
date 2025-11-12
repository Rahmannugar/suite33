import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { verifyOrgRole } from "@/lib/auth/checkRole";
import { verifyBusiness } from "@/lib/auth/checkBusiness";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { amount, description, date, userId, businessId } =
      await request.json();

    if (!amount || !description || !userId || !businessId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const businessUnauthorized = await verifyBusiness(userId, businessId);
    if (businessUnauthorized) return businessUnauthorized;

    const unauthorized = await verifyOrgRole(userId);
    if (unauthorized) return unauthorized;

    const expenditure = await prisma.expenditure.update({
      where: { id: context.params.id },
      data: { amount, description, date: date ? new Date(date) : undefined },
    });
    return NextResponse.json({ expenditure });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update expenditure" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId, businessId } = await request.json();

    if (!userId || !businessId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const businessUnauthorized = await verifyBusiness(userId, businessId);
    if (businessUnauthorized) return businessUnauthorized;

    const unauthorized = await verifyOrgRole(userId);
    if (unauthorized) return unauthorized;

    await prisma.expenditure.delete({ where: { id: context.params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete expenditure" },
      { status: 500 }
    );
  }
}
