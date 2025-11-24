"use client";

import { memo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Label,
} from "recharts";
import { useTheme } from "next-themes";
import type { KpiSummary } from "@/lib/hooks/kpi/useKPISummary";

const STATUS_COLORS: Record<
  "Pending" | "In Progress" | "Completed" | "Expired",
  string
> = {
  Pending: "#FACC15",
  "In Progress": "#3B82F6",
  Completed: "#22C55E",
  Expired: "#EF4444",
};

function KPIChartComponent({
  summary,
  mode,
}: {
  summary: KpiSummary | undefined;
  mode: "staff" | "dept";
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const side = mode === "staff" ? summary?.staff : summary?.dept;

  const data = [
    { name: "Pending", value: side?.pending || 0 },
    { name: "In Progress", value: side?.inProgress || 0 },
    { name: "Completed", value: side?.completed || 0 },
    { name: "Expired", value: side?.expired || 0 },
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hasData = total > 0;

  return (
    <div className="w-full h-72 md:h-80 lg:h-96">
      {hasData ? (
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius="72%"
              outerRadius="82%"
              stroke="none"
              paddingAngle={2}
              cornerRadius={6}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]}
                />
              ))}

              <Label
                value={total}
                position="center"
                dy={-6}
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  fill: isDark ? "#e5e7eb" : "#1f2937",
                }}
              />

              <Label
                value="Total"
                position="center"
                dy={20}
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  fill: isDark ? "#9ca3af" : "#6b7280",
                }}
              />
            </Pie>

            <Tooltip
              formatter={(value: any, name: any) => {
                const percent = ((value / total) * 100).toFixed(1);
                return [`${value} (${percent}%)`, name];
              }}
              contentStyle={{
                backgroundColor: isDark ? "#FFFFFF" : "#1E1E1E",
                border: `1px solid ${isDark ? "#e5e7eb" : "#2d2d2d"}`,
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "12px",
              }}
              itemStyle={{
                color: isDark ? "#111827" : "#FFFFFF",
              }}
            />

            <Legend
              verticalAlign="bottom"
              height={32}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                fontSize: 12,
                paddingTop: 6,
                color: isDark ? "#e5e7eb" : "#374151",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-muted-foreground text-center mt-10">
          No KPI data for this period.
        </p>
      )}
    </div>
  );
}

export const KPIChart = memo(KPIChartComponent);
