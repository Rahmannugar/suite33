import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  PayrollBatch,
  PayrollSelfView,
  ExportablePayroll,
} from "@/lib/types/payroll";

export function usePayroll() {
  const queryClient = useQueryClient();

  const batches = useQuery({
    queryKey: ["payroll", "batches"],
    queryFn: async () => {
      const { data } = await axios.get("/api/payroll/batch");
      return data as
        | PayrollBatch[]
        | { id: string; period: string; locked: boolean }[];
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  function batch(id: string) {
    return useQuery({
      queryKey: ["payroll", "batch", id],
      queryFn: async () => {
        const { data } = await axios.get(`/api/payroll/batch/${id}`);
        return data as PayrollBatch | PayrollSelfView;
      },
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    });
  }

  const createBatch = useMutation({
    mutationFn: async (payload: { period: string }) =>
      axios.post("/api/payroll/batch", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "batches"] });
    },
  });

  const updateBatch = useMutation({
    mutationFn: async (payload: { id: string; locked: boolean }) =>
      axios.put(`/api/payroll/batch/${payload.id}`, { locked: payload.locked }),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["payroll", "batch", payload.id],
      });
      queryClient.invalidateQueries({ queryKey: ["payroll", "batches"] });
    },
  });

  const updateItem = useMutation({
    mutationFn: async (payload: {
      batchId: string;
      itemId: string;
      amount: number;
      paid: boolean;
    }) =>
      axios.put(
        `/api/payroll/batch/${payload.batchId}/item/${payload.itemId}`,
        { amount: payload.amount, paid: payload.paid }
      ),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["payroll", "batch", payload.batchId],
      });
    },
  });

  function exportCSV(rows: ExportablePayroll[], label: string) {
    if (!rows.length) return;
    const Papa = require("papaparse");
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportExcel(rows: ExportablePayroll[], label: string) {
    if (!rows.length) return;
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(label);
    sheet.addRow(["Name", "Email", "Amount", "Paid"]);
    rows.forEach((r) =>
      sheet.addRow([r.Name, r.Email, r.Amount, r.Paid ? "Yes" : "No"])
    );
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    batches,
    batch,
    createBatch,
    updateBatch,
    updateItem,
    exportCSV,
    exportExcel,
  };
}
