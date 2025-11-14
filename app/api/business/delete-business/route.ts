import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { business: true },
    });

    if (profile?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.business?.id) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (profile.business?.deletedAt) {
      return NextResponse.json(
        { error: "Business is already deleted" },
        { status: 410 }
      );
    }

    const now = new Date();
    const businessId = profile.business.id;

    await prisma.sale.updateMany({
      where: { businessId },
      data: { deletedAt: now },
    });

    await prisma.expenditure.updateMany({
      where: { businessId },
      data: { deletedAt: now },
    });

    await prisma.payroll.updateMany({
      where: { businessId },
      data: { deletedAt: now },
    });

    await prisma.inventory.updateMany({
      where: { businessId },
      data: { deletedAt: now },
    });

    await prisma.category.updateMany({
      where: { businessId },
      data: { deletedAt: now },
    });

    await prisma.invite.deleteMany({
      where: { businessId },
    });

    const staffList = await prisma.staff.findMany({
      where: { businessId },
      select: { userId: true, id: true },
    });

    for (const staff of staffList) {
      await prisma.staff.update({
        where: { id: staff.id },
        data: { deletedAt: now },
      });

      await prisma.user.update({
        where: { id: staff.userId },
        data: { deletedAt: now },
      });
    }

    await prisma.department.updateMany({
      where: { businessId },
      data: { deletedAt: now },
    });

    await prisma.business.update({
      where: { id: businessId },
      data: { deletedAt: now },
    });

    await prisma.user.update({
      where: { id: data.user.id },
      data: { deletedAt: now },
    });

    const res = NextResponse.json({ success: true });
    res.cookies.delete("user_role");
    return res;
  } catch (error) {
    console.error("Business deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete business" },
      { status: 500 }
    );
  }
}
