import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { verifyAdminRole } from "@/lib/auth/checkRole";

export async function PUT(request: NextRequest) {
  try {
    const { userId, fullName, logoUrl, businessId } = await request.json();
    if (!userId || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const unauthorized = await verifyAdminRole(userId);
    if (unauthorized) return unauthorized;

    if (logoUrl) {
      await prisma.user.update({
        where: { id: userId },
        data: { fullName, avatarUrl: logoUrl },
      });
      if (businessId) {
        await prisma.business.update({
          where: { id: businessId },
          data: { logoUrl },
        });
      }
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { fullName },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update admin profile" },
      { status: 500 }
    );
  }
}
