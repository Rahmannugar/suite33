import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useSalesSummary(year: number) {
  return useQuery({
    queryKey: ["sales-summary", year],
    queryFn: async () => {
      const { data } = await axios.get(`/api/sales/summary?year=${year}`);
      return data.summary;
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}
