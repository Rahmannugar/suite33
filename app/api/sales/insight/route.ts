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

    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        date: {
          gte: new Date(year, month ? month - 1 : 0, 1),
          lte: new Date(year, month ? month : 12, 0, 23, 59, 59, 999),
        },
      },
    });

    const total = sales.reduce((sum, s) => sum + s.amount, 0);
    const avg = sales.length ? total / sales.length : 0;

    const periodLabel = month
      ? `${new Date(year, month - 1).toLocaleString("default", {
          month: "long",
        })} ${year}`
      : `Year ${year}`;

    const prompt = `
You are a professional business analyst for Suite33.

Analyze this sales data and provide a concise, structured business report.

Details:
- Period: ${periodLabel}
- Total Sales: ₦${total.toLocaleString()}
- Transactions: ${sales.length}
- Average Sale: ₦${avg.toLocaleString()}

If there are no sales, note that clearly but still provide a short recommendation on how to improve.

Return in this exact format (no extra text):

Summary:
(2–3 sentences summarizing overall performance and possible reasons)

Insights:
- (Key trend or pattern)
- (Another observation)
- (One more observation)

Recommendations:
1. (Practical, specific step)
2. (Another step)
3. (Another actionable step)

Keep it under 160 words total. Use professional, clear business language.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ insight: text });
  } catch (error) {
    console.error("Sales insight generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate sales insight",
        details: error || String(error),
      },
      { status: 500 }
    );
  }
}
