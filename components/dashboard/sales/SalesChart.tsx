"use client";

import React, { memo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltipComponent,
  CartesianGrid,
} from "recharts";

export function SalesChart({
  data,
  chartKey,
}: {
  data: any[];
  chartKey: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={420} key={chartKey}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <ChartTooltipComponent />
        <Bar dataKey="amount" fill="#2563eb" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default memo(SalesChart);
