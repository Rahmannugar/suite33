import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { email, departmentName, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    const currentBusinessId = profile.business.id;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        business: { select: { id: true } },
        Staff: { select: { businessId: true } },
      },
    });

    if (existingUser) {
      const userBusinessId =
        existingUser.business?.id || existingUser.Staff?.businessId;

      if (userBusinessId === currentBusinessId) {
        return NextResponse.json(
          { error: "This email is already registered to your business" },
          { status: 409 }
        );
      }

      if (userBusinessId) {
        return NextResponse.json(
          { error: "This email is already registered to another business" },
          { status: 409 }
        );
      }
    }

    const pendingInvite = await prisma.invite.findFirst({
      where: {
        email,
        businessId: currentBusinessId,
        accepted: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (pendingInvite) {
      return NextResponse.json(
        {
          error:
            "An active invite for this email already exists in your business",
        },
        { status: 409 }
      );
    }

    const now = new Date();
    const month = `${now.getFullYear()}-${now.getMonth() + 1}`;

    if (profile.inviteMonth !== month) {
      await prisma.user.update({
        where: { id: data.user.id },
        data: { inviteCount: 0, inviteMonth: month },
      });
    }

    if (profile.inviteCount >= 10) {
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
          businessId: currentBusinessId,
        },
      });

      if (!department) {
        department = await prisma.department.create({
          data: { name: normalizedDeptName, businessId: currentBusinessId },
        });
      }

      departmentId = department.id;
    }

    const token = uuidv4();

    const invite = await prisma.invite.create({
      data: {
        email,
        businessId: currentBusinessId,
        departmentId,
        token,
        role,
      },
      include: { business: true, department: true },
    });

    await prisma.user.update({
      where: { id: data.user.id },
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
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
