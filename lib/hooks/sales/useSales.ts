import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { SaleSchema } from "@/lib/types/sale";
import z from "zod";

export type ExportableSale = {
  Description: string;
  Amount: string;
  Date: string;
};

export function useSales(page = 1, perPage = 10, year?: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["sales", page, perPage, year],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("perPage", perPage.toString());
      if (year) params.append("year", year.toString());
      const { data } = await axios.get(`/api/sales?${params.toString()}`);
      const result = z.array(SaleSchema).safeParse(data.sales);
      if (!result.success) throw new Error("Invalid sales data");
      return {
        sales: result.data,
        pagination: data.pagination,
      };
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const addSale = useMutation({
    mutationFn: async (payload: {
      amount: number;
      description: string;
      date: Date;
    }) => {
      await axios.post("/api/sales", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales-summary"] });
    },
  });

  const editSale = useMutation({
    mutationFn: async (payload: {
      id: string;
      amount: number;
      description: string;
      date: Date;
    }) => {
      await axios.put(`/api/sales/${payload.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales-summary"] });
    },
  });

  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/sales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales-summary"] });
    },
  });

  const importCSV = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const text = e.target?.result as string;
            const rows = text
              .split("\n")
              .map((row) => row.split(","))
              .filter((row) => row.length >= 2);
            const sales = rows
              .map(([desc, amount, date]) => ({
                description: desc,
                amount: parseFloat(amount),
                date,
              }))
              .filter((s) => s.amount);
            if (!sales.length) return reject("No valid sales found");
            await axios.post("/api/sales/import", { sales });
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales-summary"] });
    },
  });

  const importExcel = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      const sales: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const desc = row.getCell(1).value?.toString() ?? "";
        const amount = parseFloat(row.getCell(2).value?.toString() ?? "0");
        const date = row.getCell(3).value?.toString() ?? "";
        if (amount) sales.push({ description: desc, amount, date });
      });
      if (!sales.length) throw new Error("No valid sales found");
      await axios.post("/api/sales/import", { sales });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales-summary"] });
    },
  });

  function exportCSV(sales: ExportableSale[], label: string) {
    if (!sales.length) return;
    const Papa = require("papaparse");
    const csv = Papa.unparse(sales);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportExcel(sales: ExportableSale[], label: string) {
    if (!sales.length) return;
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(label);
    worksheet.addRow(["Description", "Amount", "Date"]);
    sales.forEach((s) => worksheet.addRow([s.Description, s.Amount, s.Date]));
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const getInsight = useMutation({
    mutationFn: async (payload: { year: number; month?: number }) => {
      const { data } = await axios.post("/api/sales/insight", payload);
      return data.insight;
    },
  });

  return {
    sales: query.data?.sales ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    addSale,
    editSale,
    deleteSale,
    importCSV,
    importExcel,
    exportCSV,
    exportExcel,
    getInsight,
  };
}
