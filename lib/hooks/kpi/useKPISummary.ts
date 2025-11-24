"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface KpiSummaryParams {
  departmentId?: string;
  period?: string;
}

export interface KpiSummarySide {
  pending: number;
  inProgress: number;
  completed: number;
  expired: number;
}

export interface KpiSummary {
  staff: KpiSummarySide;
  dept: KpiSummarySide;
}

export function useKpiSummary(params: KpiSummaryParams) {
  return useQuery({
    queryKey: ["kpi-summary", params],
    queryFn: async () => {
      const res = await axios.post("/api/kpi/summary", params);
      return res.data.summary as KpiSummary;
    },
  });
}
