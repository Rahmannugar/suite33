import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function usePayrollSummary() {
  return useQuery({
    queryKey: ["payroll-summary"],
    queryFn: async () => {
      const { data } = await axios.get("/api/payroll/summary");
      return data.summary;
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}
