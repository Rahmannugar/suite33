import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";

export function usePayroll() {
  const query = useQuery({
    queryKey: ["payroll"],
    queryFn: async () => {
      const { data } = await axios.get("/api/payroll");
      return data.payroll;
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
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

  const generatePayroll = useMutation({
    mutationFn: async ({
      businessId,
      year,
      month,
    }: {
      businessId: string;
      year: number;
      month: number;
    }) => {
      await axios.post("/api/payroll/generate", { businessId, year, month });
    },
  });

  const bulkMarkPaid = useMutation({
    mutationFn: async ({
      departmentId,
      year,
      month,
    }: {
      departmentId: string;
      year: number;
      month: number;
    }) => {
      await axios.post("/api/payroll/bulk-mark-paid", {
        departmentId,
        year,
        month,
      });
    },
  });

  return {
    payroll: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
    markPaid,
    editSalary,
    generatePayroll,
    bulkMarkPaid,
  };
}
