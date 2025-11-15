import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ExpenditureSchema } from "@/lib/types/expenditure";
import z from "zod";
import Papa from "papaparse";
import ExcelJS from "exceljs";

export type ExportableExpenditure = {
  Description: string;
  Amount: string;
  Date: string;
};

export function useExpenditures() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["expenditures"],
    queryFn: async () => {
      const { data } = await axios.get("/api/expenditures");
      const result = z.array(ExpenditureSchema).safeParse(data.expenditures);
      if (!result.success) throw new Error("Invalid expenditures data");
      return result.data;
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const addExpenditure = useMutation({
    mutationFn: async (payload: {
      amount: number;
      description: string;
      date: Date;
    }) => {
      await axios.post("/api/expenditures", payload);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["expenditures"],
      }),
  });

  const editExpenditure = useMutation({
    mutationFn: async (payload: {
      id: string;
      amount: number;
      description: string;
      date: Date;
    }) => {
      await axios.put(`/api/expenditures/${payload.id}`, payload);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["expenditures"],
      }),
  });

  const deleteExpenditure = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/expenditures/${id}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["expenditures"],
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
              const expenditures = results.data.map((row: any) => ({
                amount: row.Amount || row.amount,
                description:
                  row.Description || row.description || "Expenditures",
                date: row.Date || row.date,
              }));
              if (!expenditures.length)
                throw new Error("No valid expenditures found in CSV");
              await axios.post("/api/expenditures/import", { expenditures });
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
        queryKey: ["expenditures"],
      }),
  });

  const importExcel = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      const expenditures: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const amount = row.getCell(2).value;
        const description = row.getCell(1).value || "Expenditures";
        const date = row.getCell(3).value;
        if (amount) expenditures.push({ amount, description, date });
      });
      if (!expenditures.length)
        throw new Error("No valid expenditures found in Excel file");
      await axios.post("/api/expenditures/import", { expenditures });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["expenditures"],
      }),
  });

  function exportCSV(expenditures: ExportableExpenditure[], label: string) {
    if (!expenditures.length) throw new Error("No expenditures to export");
    const csv = Papa.unparse(expenditures);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportExcel(
    expenditures: ExportableExpenditure[],
    label: string
  ) {
    if (!expenditures.length) throw new Error("No expenditures to export");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Expenditures");
    worksheet.columns = [
      { header: "Description", key: "Description", width: 30 },
      { header: "Amount", key: "Amount", width: 15 },
      { header: "Date", key: "Date", width: 15 },
    ];
    expenditures.forEach((e) => worksheet.addRow(e));
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
      const { data } = await axios.post("/api/expenditures/insight", payload);
      return data.insight;
    },
  });

  return {
    expenditures: query.data,
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
