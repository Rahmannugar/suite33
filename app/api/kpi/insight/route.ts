import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { scope, scopeId, period } = await request.json();

    if (!scope || !period) {
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
      include: {
        business: true,
        Staff: {
          select: {
            id: true,
            businessId: true,
            departmentId: true,
          },
        },
      },
    });

    const businessId = profile?.business?.id || profile?.Staff?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    const periodDate = new Date(period);

    if (scope === "STAFF") {
      if (!scopeId) {
        return NextResponse.json(
          { error: "Missing scopeId for STAFF scope" },
          { status: 400 }
        );
      }

      const staff = await prisma.staff.findUnique({
        where: { id: scopeId },
        select: { businessId: true, departmentId: true, id: true },
      });

      if (!staff || staff.businessId !== businessId) {
        return NextResponse.json({ error: "Staff not found" }, { status: 404 });
      }

      if (profile?.role === "ADMIN") {
      } else if (profile?.role === "SUB_ADMIN" && profile.Staff?.departmentId) {
        if (staff.departmentId !== profile.Staff.departmentId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else if (profile?.role === "STAFF" && profile.Staff?.id !== scopeId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const kpis = await prisma.staffKPI.findMany({
        where: {
          staffId: scopeId,
          period: periodDate,
          deletedAt: null,
        },
        include: { staff: { include: { user: true } } },
      });

      if (kpis.length === 0) {
        return NextResponse.json(
          { error: "No KPIs found for this staff member" },
          { status: 404 }
        );
      }

      const kpiSummary = kpis
        .map(
          (k) =>
            `${k.metric} (${k.status})${
              k.target ? ` - Target: ${k.target}` : ""
            }`
        )
        .join(", ");

      const prompt = `
You are a professional business analyst for Suite33.

Analyze these staff KPIs and provide actionable insights.

Details:
- Staff Member: ${kpis[0].staff.user.fullName || kpis[0].staff.user.email}
- Period: ${periodDate.toLocaleDateString("default", {
        month: "long",
        year: "numeric",
      })}
- KPIs: ${kpiSummary}

Return in this exact format (no extra text):

Summary:
(2–3 sentences on overall performance)

Strengths:
- (Key positive observation)
- (Another strength)

Areas for Improvement:
- (Specific area to work on)
- (Another area)

Recommendations:
1. (Actionable step)
2. (Another step)
3. (Another step)

Keep it under 160 words total. Use professional, clear language.
`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const insight = result.response.text();

      return NextResponse.json({ insight });
    }

    if (scope === "DEPARTMENT") {
      if (!scopeId) {
        return NextResponse.json(
          { error: "Missing scopeId for DEPARTMENT scope" },
          { status: 400 }
        );
      }

      const department = await prisma.department.findUnique({
        where: { id: scopeId },
        select: { businessId: true, name: true },
      });

      if (!department || department.businessId !== businessId) {
        return NextResponse.json(
          { error: "Department not found" },
          { status: 404 }
        );
      }

      if (profile?.role === "ADMIN") {
      } else if (
        (profile?.role === "SUB_ADMIN" || profile?.role === "STAFF") &&
        profile.Staff?.departmentId !== scopeId
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const kpis = await prisma.departmentKPI.findMany({
        where: {
          departmentId: scopeId,
          period: periodDate,
          deletedAt: null,
        },
        include: { department: true },
      });

      if (kpis.length === 0) {
        return NextResponse.json(
          { error: "No KPIs found for this department" },
          { status: 404 }
        );
      }

      const kpiSummary = kpis
        .map(
          (k) =>
            `${k.metric} (${k.status})${
              k.target ? ` - Target: ${k.target}` : ""
            }`
        )
        .join(", ");

      const prompt = `
You are a professional business analyst for Suite33.

Analyze these department KPIs and provide strategic insights.

Details:
- Department: ${department.name}
- Period: ${periodDate.toLocaleDateString("default", {
        month: "long",
        year: "numeric",
      })}
- KPIs: ${kpiSummary}

Return in this exact format (no extra text):

Summary:
(2–3 sentences on overall department performance)

Key Metrics:
- (Important trend or pattern)
- (Another observation)

Recommendations:
1. (Strategic action)
2. (Another action)
3. (Another action)

Keep it under 160 words total. Use professional, clear language.
`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const insight = result.response.text();

      return NextResponse.json({ insight });
    }

    if (scope === "BUSINESS") {
      if (profile?.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only admins can view business-wide insights" },
          { status: 403 }
        );
      }

      const staffKPIs = await prisma.staffKPI.findMany({
        where: {
          staff: { businessId },
          period: periodDate,
          deletedAt: null,
        },
      });

      const deptKPIs = await prisma.departmentKPI.findMany({
        where: {
          businessId,
          period: periodDate,
          deletedAt: null,
        },
      });

      if (staffKPIs.length === 0 && deptKPIs.length === 0) {
        return NextResponse.json(
          { error: "No KPIs found for this business" },
          { status: 404 }
        );
      }

      const statusCounts = {
        PENDING: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
        EXPIRED: 0,
      };

      staffKPIs.forEach((k) => {
        if (k.status in statusCounts) {
          statusCounts[k.status as keyof typeof statusCounts]++;
        }
      });

      deptKPIs.forEach((k) => {
        if (k.status in statusCounts) {
          statusCounts[k.status as keyof typeof statusCounts]++;
        }
      });

      const prompt = `
You are a professional business analyst for Suite33.

Analyze these business-wide KPIs and provide executive insights.

Details:
- Period: ${periodDate.toLocaleDateString("default", {
        month: "long",
        year: "numeric",
      })}
- Total Staff KPIs: ${staffKPIs.length}
- Total Department KPIs: ${deptKPIs.length}
- Status Breakdown:
  - Pending: ${statusCounts.PENDING}
  - In Progress: ${statusCounts.IN_PROGRESS}
  - Completed: ${statusCounts.COMPLETED}
  - Expired: ${statusCounts.EXPIRED}

Return in this exact format (no extra text):

Summary:
(2–3 sentences on overall business performance)

Insights:
- (Key business trend)
- (Another observation)
- (One more insight)

Strategic Recommendations:
1. (High-level action)
2. (Another action)
3. (Another action)

Keep it under 160 words total. Use executive-level language.
`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const insight = result.response.text();

      return NextResponse.json({ insight });
    }

    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  } catch (error) {
    console.error("KPI insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
