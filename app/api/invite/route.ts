import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const { email, businessId, departmentName } = await req.json();

    if (!email || !businessId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let departmentId: string | undefined = undefined;

    // If departmentName is provided, find or create department for this business
    if (departmentName) {
      let department = await prisma.department.findFirst({
        where: { name: departmentName, businessId },
      });

      if (!department) {
        department = await prisma.department.create({
          data: { name: departmentName, businessId },
        });
      }

      departmentId = department.id;
    }

    const token = uuidv4();

    const invite = await prisma.invite.create({
      data: { email, businessId, departmentId, token },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/invite?token=${token}`;

    // Send invite email
    await resend.emails.send({
      from: "Suite33 <noreply@suite33.app>",
      to: email,
      subject: "You’ve been invited to join Suite33",
      html: `
        <h2>Welcome to Suite33</h2>
        <p>You’ve been invited to join your team. Click the link below to accept your invitation and set up your account.</p>
        <p><a href="${inviteUrl}" style="color:#2563eb;text-decoration:none;font-weight:bold;">Join Suite33</a></p>
      `,
    });

    return NextResponse.json({ invite });
  } catch (error) {
    console.error("Invite Error:", error);
    return NextResponse.json(
      { error: "Failed to send invite" },
      { status: 500 }
    );
  }
}
