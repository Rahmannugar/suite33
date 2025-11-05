import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import z from "zod";
import { InventorySchema } from "../types/inventory";

export function useInventory(user?: { businessId?: string }) {
  const queryClient = useQueryClient();

  const inventoryQuery = useQuery({
    queryKey: ["inventory", user?.businessId],
    queryFn: async () => {
      const { data } = await axios.get("/api/inventory");
      const result = z.array(InventorySchema).safeParse(data.inventory);
      if (!result.success) throw new Error("Invalid inventory data");
      return result.data;
    },
    enabled: !!user?.businessId,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const lowStockQuery = useQuery({
    queryKey: ["inventory-low-stock", user?.businessId],
    queryFn: async () => {
      const { data } = await axios.get("/api/inventory/low-stock");
      return data.lowStock;
    },
    enabled: !!user?.businessId,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", user?.businessId],
    queryFn: async () => {
      if (!user?.businessId) return [];
      const { data } = await axios.get(`/api/categories?businessId=${user.businessId}`);
      return data.categories;
    },
    enabled: !!user?.businessId,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const refetchAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["inventory"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-low-stock"] }),
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
    ]);
  };

  const addCategory = useMutation({
    mutationFn: async (payload: { name: string; businessId: string }) => {
      const { data } = await axios.post("/api/categories", payload);
      return data.category;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const addItem = useMutation({
    mutationFn: async (payload: {
      name: string;
      quantity: number;
      categoryId: string;
      businessId: string;
    }) => {
      await axios.post("/api/inventory", payload);
    },
    onSuccess: refetchAll,
  });

  const editItem = useMutation({
    mutationFn: async (payload: {
      id: string;
      name: string;
      quantity: number;
      categoryId: string;
    }) => {
      await axios.put(`/api/inventory/${payload.id}`, payload);
    },
    onSuccess: refetchAll,
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/inventory/${id}`);
    },
    onSuccess: refetchAll,
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
              (row: any) => row.name && row.categoryId
            );
            if (!validRows.length)
              return reject(new Error("No valid inventory data found in CSV"));
            validRows.forEach((row: any) => {
              if (!row.quantity) row.quantity = 0;
            });
            await axios.post("/api/inventory/import", {
              items: validRows,
              businessId,
            });
            resolve();
          },
        });
      });
    },
    onSuccess: refetchAll,
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
      const items: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        if (!row.values || !Array.isArray(row.values)) return;
        const [name, quantity, categoryId] = (row.values as any[]).slice(1);
        if (name && categoryId) {
          items.push({
            name,
            quantity: quantity ? parseInt(quantity) : 0,
            categoryId,
          });
        }
      });
      if (!items.length)
        throw new Error("No valid inventory data found in Excel");
      await axios.post("/api/inventory/import", { items, businessId });
    },
    onSuccess: refetchAll,
  });

  function exportCSV(items: any[]) {
    const csv = Papa.unparse(items);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportExcel(items: any[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Inventory");
    worksheet.addRow(["Name", "Quantity", "CategoryId"]);
    items.forEach((item) => {
      worksheet.addRow([item.name, item.quantity, item.categoryId]);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    inventory: inventoryQuery.data,
    isLoading: inventoryQuery.isLoading,
    lowStock: lowStockQuery.data,
    isLowStockLoading: lowStockQuery.isLoading,
    categories: categoriesQuery.data,
    isCategoriesLoading: categoriesQuery.isLoading,
    addCategory,
    addItem,
    editItem,
    deleteItem,
    importCSV,
    importExcel,
    exportCSV,
    exportExcel,
    refetchLowStock: lowStockQuery.refetch,
  };
}
