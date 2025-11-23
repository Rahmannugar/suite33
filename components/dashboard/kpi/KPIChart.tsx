"use client";
import { memo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = ["#FACC15", "#3B82F6", "#22C55E", "#EF4444"];

function KPIChartComponent({ summary }: { summary: any }) {
  const data = [
    { name: "Pending", value: summary?.pending || 0 },
    { name: "In Progress", value: summary?.inProgress || 0 },
    { name: "Completed", value: summary?.completed || 0 },
    { name: "Expired", value: summary?.expired || 0 },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" outerRadius={90} label>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export const KPIChart = memo(KPIChartComponent);
