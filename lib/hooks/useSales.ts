import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { SaleSchema } from "../types/sale";
import z from "zod";
import Papa from "papaparse";
import ExcelJS from "exceljs";

export type ExportableSale = {
  Description: string;
  Amount: string;
  Date: string;
};

export function useSales() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data } = await axios.get("/api/sales");
      const result = z.array(SaleSchema).safeParse(data.sales);
      if (!result.success) throw new Error("Invalid sales data");
      return result.data;
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
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["sales"],
      }),
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
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["sales"],
      }),
  });

  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/sales/${id}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["sales"],
      }),
  });

  const importCSV = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      return new Promise<void>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results: any) => {
            try {
              const sales = results.data.map((row: any) => ({
                amount: row.Amount || row.amount,
                description: row.Description || row.description || "Sales",
                date: row.Date || row.date,
              }));
              if (!sales.length) throw new Error("No valid sales found in CSV");
              await axios.post("/api/sales/import", { sales });
              resolve();
            } catch (err: any) {
              reject(err);
            }
          },
          error: (err: any) => reject(err),
        });
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["sales"],
      }),
  });

  const importExcel = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      const sales: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const amount = row.getCell(2).value;
        const description = row.getCell(1).value || "Sales";
        const date = row.getCell(3).value;
        if (amount) sales.push({ amount, description, date });
      });
      if (!sales.length) throw new Error("No valid sales found in Excel file");
      await axios.post("/api/sales/import", { sales });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["sales"],
      }),
  });

  function exportCSV(sales: ExportableSale[], label: string) {
    if (!sales.length) throw new Error("No sales to export");
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
    if (!sales.length) throw new Error("No sales to export");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales");
    worksheet.columns = [
      { header: "Description", key: "Description", width: 30 },
      { header: "Amount", key: "Amount", width: 15 },
      { header: "Date", key: "Date", width: 15 },
    ];
    sales.forEach((s) => worksheet.addRow(s));
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
    sales: query.data,
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
