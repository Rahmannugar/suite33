import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { token, userId, email } = await request.json();

    if (!token || !userId || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { business: true, department: true },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered to another business." },
        { status: 409 }
      );
    }

    await prisma.invite.update({
      where: { token },
      data: { accepted: true },
    });

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email,
        role: invite.role,
      },
    });

    await prisma.staff.create({
      data: {
        user: { connect: { id: newUser.id } },
        business: { connect: { id: invite.businessId } },
        department: invite.departmentId
          ? { connect: { id: invite.departmentId } }
          : undefined,
      },
    });

    const res = NextResponse.json({ success: true, newUser });
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
