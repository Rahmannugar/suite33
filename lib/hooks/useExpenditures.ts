import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { ExpenditureSchema } from "../types/expenditure";
import z from "zod";

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
      description?: string;
      businessId: string;
      date: Date;
    }) => {
      await axios.post("/api/expenditures", payload);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["expenditures"] }),
  });

  const editExpenditure = useMutation({
    mutationFn: async (payload: {
      id: string;
      amount: number;
      description?: string;
      date: Date;
    }) => {
      await axios.put(`/api/expenditures/${payload.id}`, payload);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["expenditures"] }),
  });

  const deleteExpenditure = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/expenditures/${id}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["expenditures"] }),
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
              return reject(
                new Error("No valid expenditure data found in CSV")
              );
            validRows.forEach((row: any) => {
              if (!row.date) row.date = new Date().toISOString();
            });
            await axios.post("/api/expenditures/import", {
              expenditures: validRows,
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
      const expenditures: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
        if (!row.values || !Array.isArray(row.values)) return;
        const [amount, description, date] = (row.values as any[]).slice(1);
        if (amount && !isNaN(Number(amount))) {
          expenditures.push({
            amount,
            description,
            date: date
              ? new Date(date).toISOString()
              : new Date().toISOString(),
          });
        }
      });
      if (!expenditures.length)
        throw new Error("No valid expenditure data found in Excel");
      await axios.post("/api/expenditures/import", {
        expenditures,
        businessId,
      });
    },
  });

  function exportCSV(expenditures: any[]) {
    const csv = Papa.unparse(expenditures);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenditures.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportExcel(expenditures: any[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Expenditures");
    worksheet.addRow(["Amount", "Description", "Date"]);
    expenditures.forEach((e) => {
      worksheet.addRow([e.amount, e.description, e.date]);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenditures.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  const getInsight = useMutation({
    mutationFn: async (payload: {
      year: number;
      month?: number;
      businessId: string;
    }) => {
      const { data } = await axios.post("/api/expenditures/insight", payload);
      return data;
    },
  });

  return {
    expenditures: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
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
