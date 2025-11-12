import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { verifyOrgRole } from "@/lib/auth/checkRole";
import { verifyBusiness } from "@/lib/auth/checkBusiness";

export async function POST(request: NextRequest) {
  try {
    const { sales, businessId, userId } = await request.json();

    if (!Array.isArray(sales) || !businessId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const businessUnauthorized = await verifyBusiness(userId, businessId);
    if (businessUnauthorized) return businessUnauthorized;

    const unauthorized = await verifyOrgRole(userId);
    if (unauthorized) return unauthorized;

    for (const s of sales) {
      if (!s.amount) continue;
      const desc =
        s.description && s.description.trim() ? s.description : "Sales";
      await prisma.sale.create({
        data: {
          amount: parseFloat(s.amount),
          description: desc,
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
