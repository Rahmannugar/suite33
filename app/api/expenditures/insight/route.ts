import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { year, month, businessId } = await request.json();
    if (!businessId || !year) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if insight already generated this week
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const existing = await prisma.insight.findFirst({
      where: {
        businessId,
        type: "EXPENDITURE",
        year,
        ...(month && { month }),
        createdAt: { gte: weekStart },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return NextResponse.json({ insight: existing.text, cached: true });
    }

    // Get expenditures for the period
    const expenditures = await prisma.expenditure.findMany({
      where: {
        businessId,
        date: {
          gte: new Date(year, month ? month - 1 : 0, 1),
          lte: new Date(year, month ? month : 12, 0, 23, 59, 59, 999),
        },
      },
    });

    const total = expenditures.reduce((sum, e) => sum + e.amount, 0);
    const prompt = `You are an expert business analyst. Here is the expenditure data for ${
      month ? `month ${month}` : `year ${year}`
    }: Total expenditures: ₦${total.toLocaleString()}. Give a summary and 3 actionable recommendations to reduce costs.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    await prisma.insight.create({
      data: {
        businessId,
        type: "EXPENDITURE",
        year,
        month,
        text,
      },
    });

    return NextResponse.json({ insight: text, cached: false });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get AI insight" },
      { status: 500 }
    );
  }
}
