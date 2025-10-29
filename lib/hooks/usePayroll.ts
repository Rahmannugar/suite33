import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { PayrollSchema } from "../types/payroll";
import z from "zod";

export function usePayroll() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["payroll"],
    queryFn: async () => {
      const { data } = await axios.get("/api/payroll");
      const result = z.array(PayrollSchema).safeParse(data.payroll);
      if (!result.success) throw new Error("Invalid payroll data");
      return result.data;
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      await axios.post(`/api/payroll/${id}/mark-paid`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll"] }),
  });

  const editSalary = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      await axios.put(`/api/payroll/${id}`, { amount });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll"] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll"] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll"] }),
  });

  return {
    payroll: query.data,
    isLoading: query.isLoading,
    markPaid,
    editSalary,
    generatePayroll,
    bulkMarkPaid,
  };
}
