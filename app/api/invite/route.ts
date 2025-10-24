import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import emailjs from "@emailjs/browser";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, businessId, departmentName, adminId } = await req.json();

    if (!email || !businessId || !adminId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check invite limit for this admin
    const now = new Date();
    const month = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const admin = await prisma.user.findUnique({ where: { id: adminId } });

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
      data: { email, businessId, departmentId, token },
    });

    // Increment invite count
    await prisma.user.update({
      where: { id: adminId },
      data: { inviteCount: { increment: 1 } },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/invite?token=${token}`;

    // Send invite email via EmailJS
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID!,
      process.env.EMAILJS_TEMPLATE_ID!,
      {
        to_email: email,
        invite_url: inviteUrl,
        business_name: invite.business?.name ?? "",
        department_name: departmentName ?? "",
      },
      process.env.EMAILJS_PUBLIC_KEY!
    );

    return NextResponse.json({ invite });
  } catch (error) {
    console.error("Invite Error:", error);
    return NextResponse.json(
      { error: "Failed to send invite" },
      { status: 500 }
    );
  }
}
