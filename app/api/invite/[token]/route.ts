import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: { token: string } }
) {
  const { token } = context.params;

  try {
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { business: true },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 404 }
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
