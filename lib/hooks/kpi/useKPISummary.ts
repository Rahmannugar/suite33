import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface KpiSummaryParams {
  departmentId?: string;
  period?: string;
}

export function useKpiSummary(params: KpiSummaryParams) {
  return useQuery({
    queryKey: ["kpi-summary", params],
    queryFn: async () => {
      const res = await axios.post("/api/kpi/summary", params);
      return res.data.summary;
    },
  });
}
