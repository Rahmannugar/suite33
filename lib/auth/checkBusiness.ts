import { prisma } from "@/prisma/config";
import { NextResponse } from "next/server";

export async function verifyBusiness(userId?: string, businessId?: string) {
  if (!userId || !businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, business: { select: { id: true } } },
  });

  if (user?.role === "ADMIN" && user.business?.id === businessId) {
    return null;
  }

  const staff = await prisma.staff.findUnique({
    where: { userId },
    select: { businessId: true },
  });

  if (staff && staff.businessId === businessId) {
    return null;
  }

  return NextResponse.json(
    { error: "Forbidden: business mismatch" },
    { status: 403 }
  );
}
