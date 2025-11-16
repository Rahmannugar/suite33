"use client";

import { ChartTooltip } from "@/lib/utils/chart";
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

export function ExpendituresChart({
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
        <ChartTooltipComponent content={<ChartTooltip />} />
        <Bar dataKey="amount" fill="#eab308" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default memo(ExpendituresChart);
