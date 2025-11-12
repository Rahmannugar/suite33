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

export function useSales(user?: { businessId?: string; id?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["sales", user?.businessId, user?.id],
    queryFn: async () => {
      if (!user?.businessId || !user?.id) return [];
      const { data } = await axios.get(
        `/api/sales?businessId=${user.businessId}&userId=${user.id}`
      );
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
      businessId: string;
      userId: string;
      date: Date;
    }) => {
      await axios.post("/api/sales", payload);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["sales", user?.businessId, user?.id],
      }),
  });

  const editSale = useMutation({
    mutationFn: async (payload: {
      id: string;
      amount: number;
      description: string;
      date: Date;
      userId: string;
      businessId: string;
    }) => {
      await axios.put(`/api/sales/${payload.id}`, payload);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["sales", user?.businessId, user?.id],
      }),
  });

  const deleteSale = useMutation({
    mutationFn: async (payload: {
      id: string;
      userId: string;
      businessId: string;
    }) =>
      axios.delete(`/api/sales/${payload.id}`, {
        data: payload,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["sales", user?.businessId, user?.id],
      }),
  });

  const importCSV = useMutation({
    mutationFn: async ({
      file,
      businessId,
      userId,
    }: {
      file: File;
      businessId: string;
      userId: string;
    }) => {
      return new Promise<void>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          complete: async (results: any) => {
            const sales = results.data;
            if (!Array.isArray(sales) || !businessId || !userId) {
              reject(new Error("Invalid import data"));
              return;
            }
            await axios.post("/api/sales/import", {
              sales,
              businessId,
              userId,
            });
            resolve();
          },
          error: (err: any) => reject(err),
        });
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["sales", user?.businessId, user?.id],
      }),
  });

  const importExcel = useMutation({
    mutationFn: async ({
      file,
      businessId,
      userId,
    }: {
      file: File;
      businessId: string;
      userId: string;
    }) => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      const sales: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const values = row.values;
        if (!values || typeof values !== "object") return;
        const arr = Array.isArray(values) ? values : Object.values(values);
        const [, description, amount, date] = arr;
        if (description && amount) {
          sales.push({ description, amount: Number(amount) || 0, date });
        }
      });
      if (!sales.length) throw new Error("No sales found in Excel file");
      await axios.post("/api/sales/import", { sales, businessId, userId });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["sales", user?.businessId, user?.id],
      }),
  });

  function exportCSV(sales: ExportableSale[], label: string) {
    if (!sales.length) return;
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
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(label);
    worksheet.addRow(["Description", "Amount", "Date"]);
    sales.forEach((s) => worksheet.addRow([s.Description, s.Amount, s.Date]));
    worksheet.columns.forEach((col) => (col.width = 20));
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
    mutationFn: async (payload: {
      year: number;
      month?: number;
      businessId: string;
      userId: string;
    }) => {
      const { data } = await axios.post("/api/sales/insight", payload);
      return data;
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
