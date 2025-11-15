import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useSalesSummary(year: number, month?: number) {
  return useQuery({
    queryKey: ["sales-summary", year, month],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("year", year.toString());
      if (month) params.append("month", month.toString());
      const { data } = await axios.get(
        `/api/sales/summary?${params.toString()}`
      );
      return data.summary;
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}
