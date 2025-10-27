import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import Papa from "papaparse";
import ExcelJS from "exceljs";

export function useSales() {
  const query = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data } = await axios.get("/api/sales");
      return data.sales;
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
  });

  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/sales/${id}`);
    },
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
            // Validate schema
            const validRows = results.data.filter(
              (row: any) => row.amount && !isNaN(Number(row.amount))
            );
            if (!validRows.length)
              return reject(new Error("No valid sales data found in CSV"));
            // Ensure date is present or use current date
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
        if (rowNumber === 1) return; // skip header
        if (!row.values || !Array.isArray(row.values)) return;
        const [amount, description, date] = (row.values as any[]).slice(1);
        if (amount && !isNaN(Number(amount))) {
          sales.push({
            amount,
            description,
            date: date
              ? new Date(date).toISOString()
              : new Date().toISOString(),
          });
        }
      });
      if (!sales.length) throw new Error("No valid sales data found in Excel");
      await axios.post("/api/sales/import", { sales, businessId });
    },
  });

  function exportCSV(sales: any[]) {
    const csv = Papa.unparse(sales);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportExcel(sales: any[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales");
    worksheet.addRow(["Amount", "Description", "Date"]);
    sales.forEach((s) => {
      worksheet.addRow([s.amount, s.description, s.date]);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales.xlsx";
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
    refetch: query.refetch,
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
