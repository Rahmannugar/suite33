import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { year, month, businessId } = await req.json();
    if (!businessId || !year) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if insight already generated this week
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    const existing = await prisma.insight.findFirst({
      where: {
        businessId,
        type: "SALES",
        year,
        ...(month && { month }),
        createdAt: { gte: weekStart },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return NextResponse.json({ insight: existing.text, cached: true });
    }

    // Get sales data for the period
    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        date: {
          gte: new Date(year, month ? month - 1 : 0, 1),
          lte: new Date(year, month ? month : 12, 0, 23, 59, 59, 999),
        },
      },
    });

    // Prepare prompt for Gemini
    const total = sales.reduce((sum, s) => sum + s.amount, 0);
    const prompt = `You are an expert business analyst. Here is the sales data for ${
      month ? `month ${month}` : `year ${year}`
    }: Total sales: ₦${total.toLocaleString()}. Give a summary and 3 actionable recommendations to improve sales.`;

    // Call Gemini API (free tier)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Save insight
    await prisma.insight.create({
      data: {
        businessId,
        type: "SALES",
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
