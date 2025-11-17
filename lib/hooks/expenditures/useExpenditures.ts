import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ExpenditureSchema } from "@/lib/types/expenditure";
import z from "zod";

export type ExportableExpenditure = {
  Description: string;
  Amount: string;
  Date: string;
};

export function useExpenditures(
  page = 1,
  perPage = 10,
  year?: number,
  month?: number,
  search?: string
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["expenditures", page, perPage, year, month, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("perPage", perPage.toString());
      if (year) params.append("year", String(year));
      if (month) params.append("month", String(month));
      if (search?.trim()) params.append("search", search.trim().toLowerCase());

      const { data } = await axios.get(
        `/api/expenditures?${params.toString()}`
      );

      const parsed = z.array(ExpenditureSchema).safeParse(data.expenditures);
      if (!parsed.success) throw new Error("Invalid expenditures data");

      return {
        expenditures: parsed.data,
        pagination: data.pagination,
      };
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const addExpenditure = useMutation({
    mutationFn: async (payload: {
      amount: number;
      description: string;
      date: Date;
    }) => axios.post("/api/expenditures", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenditures"] });
      queryClient.invalidateQueries({ queryKey: ["expenditures-summary"] });
    },
  });

  const editExpenditure = useMutation({
    mutationFn: async (payload: {
      id: string;
      amount: number;
      description: string;
      date: Date;
    }) => axios.put(`/api/expenditures/${payload.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenditures"] });
      queryClient.invalidateQueries({ queryKey: ["expenditures-summary"] });
    },
  });

  const deleteExpenditure = useMutation({
    mutationFn: async (id: string) => axios.delete(`/api/expenditures/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenditures"] });
      queryClient.invalidateQueries({ queryKey: ["expenditures-summary"] });
    },
  });

  const importCSV = useMutation({
    mutationFn: async ({ file }: { file: File }) =>
      new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const text = e.target?.result as string;
            const rows = text.split("\n").map((row) => row.split(","));
            const items = rows
              .map(([desc, amount, date]) => ({
                description: desc,
                amount: parseFloat(amount),
                date,
              }))
              .filter((s) => s.amount);
            await axios.post("/api/expenditures/import", {
              expenditures: items,
            });
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsText(file);
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenditures"] });
      queryClient.invalidateQueries({ queryKey: ["expenditures-summary"] });
    },
  });

  const importExcel = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const sheet = workbook.worksheets[0];

      const list: any[] = [];
      sheet.eachRow((row, idx) => {
        if (idx === 1) return;
        const desc = row.getCell(1).value?.toString() ?? "";
        const amount = parseFloat(row.getCell(2).value?.toString() ?? "0");
        const date = row.getCell(3).value?.toString() ?? "";
        if (amount) list.push({ description: desc, amount, date });
      });

      await axios.post("/api/expenditures/import", { expenditures: list });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenditures"] });
      queryClient.invalidateQueries({ queryKey: ["expenditures-summary"] });
    },
  });

  function exportCSV(rows: ExportableExpenditure[], label: string) {
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

  async function exportExcel(rows: ExportableExpenditure[], label: string) {
    if (!rows.length) return;
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(label);
    sheet.addRow(["Description", "Amount", "Date"]);
    rows.forEach((r) => sheet.addRow([r.Description, r.Amount, r.Date]));
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const getInsight = useMutation({
    mutationFn: async (payload: { year: number; month?: number }) => {
      const { data } = await axios.post("/api/expenditures/insight", payload);
      return data.insight;
    },
  });

  return {
    expenditures: query.data?.expenditures ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    addExpenditure,
    editExpenditure,
    deleteExpenditure,
    importCSV,
    importExcel,
    exportCSV,
    exportExcel,
    getInsight,
  };
}
