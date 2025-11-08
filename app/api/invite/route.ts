import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, businessId, departmentName, adminId, role } =
      await request.json();

    if (!email || !businessId || !adminId || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check invite limit for this admin
    const now = new Date();
    const month = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const admin = await prisma.user.findUnique({ where: { id: adminId } });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 }
      );
    }

    // Reset count if month changed
    if (admin.inviteMonth !== month) {
      await prisma.user.update({
        where: { id: adminId },
        data: { inviteCount: 0, inviteMonth: month },
      });
    }

    if (admin.inviteCount >= 10) {
      return NextResponse.json(
        { error: "Invite limit reached (10 per month)" },
        { status: 403 }
      );
    }

    let departmentId: string | undefined = undefined;
    if (departmentName) {
      const normalizedDeptName = departmentName.trim().toLowerCase();
      let department = await prisma.department.findFirst({
        where: {
          name: normalizedDeptName,
          businessId,
        },
      });

      if (!department) {
        department = await prisma.department.create({
          data: { name: normalizedDeptName, businessId },
        });
      }

      departmentId = department.id;
    }

    const token = uuidv4();

    const invite = await prisma.invite.create({
      data: {
        email,
        businessId,
        departmentId,
        token,
        role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      include: { business: true, department: true },
    });

    await prisma.user.update({
      where: { id: adminId },
      data: { inviteCount: { increment: 1 } },
    });

    return NextResponse.json({
      invite: {
        token,
        email,
        businessName: invite.business?.name ?? "",
        departmentName: invite.department?.name ?? "",
      },
    });
  } catch (error) {
    console.error("Invite Error:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
