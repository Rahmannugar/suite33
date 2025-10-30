import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { z } from "zod";
import { SaleSchema } from "@/lib/types/sale";

type ExportableSale = {
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
      description?: string;
      businessId: string;
      date: Date;
    }) => {
      await axios.post("/api/sales", payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
  });

  const editSale = useMutation({
    mutationFn: async (payload: {
      id: string;
      amount: number;
      description?: string;
      date: Date;
    }) => {
      await axios.put(`/api/sales/${payload.id}`, payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
  });

  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/sales/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
  });

  const importCSV = useMutation({
    mutationFn: async ({
      file,
      businessId,
    }: {
      file: File;
      businessId: string;
    }) => {
      return new Promise<void>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          complete: async (results) => {
            const validRows = results.data.filter(
              (row: any) => row.amount && !isNaN(Number(row.amount))
            );
            if (!validRows.length)
              return reject(new Error("No valid sales data found in CSV"));
            validRows.forEach((row: any) => {
              if (!row.date) row.date = new Date().toISOString();
            });
            await axios.post("/api/sales/import", {
              sales: validRows,
              businessId,
            });
            resolve();
          },
        });
      });
    },
  });

  const importExcel = useMutation({
    mutationFn: async ({
      file,
      businessId,
    }: {
      file: File;
      businessId: string;
    }) => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      const sales: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const [description, amount, date] = (row.values as any[]).slice(1);
        if (amount && !isNaN(Number(amount))) {
          sales.push({
            amount,
            description,
            date: date ? new Date(date).toISOString() : new Date().toISOString(),
          });
        }
      });
      if (!sales.length) throw new Error("No valid sales data found in Excel");
      await axios.post("/api/sales/import", { sales, businessId });
    },
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
