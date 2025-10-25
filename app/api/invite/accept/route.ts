import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { token, userId, email } = await req.json();

    if (!token || !userId || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Find the invite
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { business: true, department: true },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
    }

    // Mark invite as accepted
    await prisma.invite.update({
      where: { token },
      data: { accepted: true },
    });

    // Create or update the user in Prisma
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        role: invite.role, // Use role from invite (STAFF or SUB_ADMIN)
        business: { connect: { id: invite.businessId } },
      },
      create: {
        id: userId,
        email,
        role: invite.role,
        business: { connect: { id: invite.businessId } },
      },
      include: { business: true },
    });

    // Create staff record linked to the business and user
    await prisma.staff.upsert({
      where: { userId },
      update: {
        business: { connect: { id: invite.businessId } },
        department: invite.departmentId
          ? { connect: { id: invite.departmentId } }
          : undefined,
      },
      create: {
        user: { connect: { id: userId } },
        business: { connect: { id: invite.businessId } },
        department: invite.departmentId
          ? { connect: { id: invite.departmentId } }
          : undefined,
      },
    });

    // Set secure role cookie
    const res = NextResponse.json({ success: true, user });
    res.cookies.set("user_role", invite.role, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}
