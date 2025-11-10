import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";

export async function PUT(request: NextRequest) {
  try {
    const { businessId, name, industry, location } = await request.json();

    if (!businessId || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        name,
        industry,
        location,
      },
      include: {
        owner: true,
        staff: {
          include: {
            user: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json({ business });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
