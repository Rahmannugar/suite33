import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/prisma/config";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  try {
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { business: true },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invite has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({ invite });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to get invite" },
      { status: 500 }
    );
  }
}
