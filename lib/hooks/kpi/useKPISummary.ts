import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface KpiSummaryParams {
  departmentId?: string;
  period?: string;
}

export function useKpiSummary(params: KpiSummaryParams) {
  const cleaned = {
    departmentId:
      params.departmentId === "all" ? undefined : params.departmentId,
    period: params.period || undefined,
  };

  return useQuery({
    queryKey: ["kpi-summary", cleaned],
    queryFn: async () => {
      const res = await axios.post("/api/kpi/summary", cleaned);
      return res.data.summary;
    },
    enabled: true,
  });
}
