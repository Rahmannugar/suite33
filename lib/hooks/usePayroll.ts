import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";

export function usePayroll() {
  const query = useQuery({
    queryKey: ["payroll"],
    queryFn: async () => {
      const { data } = await axios.get("/api/payroll");
      return data.payroll;
    },
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      await axios.post(`/api/payroll/${id}/mark-paid`);
    },
  });

  const editSalary = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      await axios.put(`/api/payroll/${id}`, { amount });
    },
  });

  return {
    payroll: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
    markPaid,
    editSalary,
  };
}
