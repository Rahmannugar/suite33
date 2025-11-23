import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { year, month } = await request.json();

    if (!year) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: {
        business: true,
        Staff: { select: { businessId: true } },
      },
    });

    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    const start = new Date(year, month ? month - 1 : 0, 1);
    const end = new Date(year, month ? month : 12, 0, 23, 59, 59, 999);

    const staffKPIs = await prisma.staffKPI.findMany({
      where: {
        deletedAt: null,
        period: { gte: start, lte: end },
        staff: { businessId },
      },
    });

    const departmentKPIs = await prisma.departmentKPI.findMany({
      where: {
        deletedAt: null,
        businessId,
        period: { gte: start, lte: end },
      },
    });

    const total = staffKPIs.length + departmentKPIs.length;

    const statusCounts = {
      PENDING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      EXPIRED: 0,
    };

    [...staffKPIs, ...departmentKPIs].forEach((kpi) => {
      statusCounts[kpi.status] = (statusCounts[kpi.status] || 0) + 1;
    });

    const periodLabel = month
      ? `${new Date(year, month - 1).toLocaleString("default", {
          month: "long",
        })} ${year}`
      : `Year ${year}`;

    const prompt = `
You are a professional business analyst for Suite33.

Analyze this KPI data and produce a structured, concise performance insight.

Details:
- Period: ${periodLabel}
- Total KPIs: ${total}
- Pending: ${statusCounts.PENDING}
- In Progress: ${statusCounts.IN_PROGRESS}
- Completed: ${statusCounts.COMPLETED}
- Expired: ${statusCounts.EXPIRED}

If there are no KPIs, clearly mention it and still provide short recommendations.

Return in this exact format:

Summary:
(2–3 sentences with a clear performance overview)

Insights:
- (Key pattern or status trend)
- (Another important observation)
- (One more insight)

Recommendations:
1. (Practical, specific action)
2. (Another improvement step)
3. (Another actionable recommendation)

Keep total output under 160 words. Use professional business language.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ insight: text });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate KPI insight",
        details: error || String(error),
      },
      { status: 500 }
    );
  }
}
