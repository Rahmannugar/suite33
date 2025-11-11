import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { InventorySchema } from "../types/inventory";
import z from "zod";
import Papa from "papaparse";
import ExcelJS from "exceljs";

export function findSimilarCategory(categories: any[], searchName: string) {
  const normalized = searchName.trim().toLowerCase();
  return categories.find((cat) => cat.name.toLowerCase() === normalized);
}

export function useInventory(user?: { businessId?: string; id?: string }) {
  const queryClient = useQueryClient();

  const inventoryQuery = useQuery({
    queryKey: ["inventory", user?.businessId, user?.id],
    queryFn: async () => {
      if (!user?.businessId || !user?.id) return [];
      const { data } = await axios.get(
        `/api/inventory?businessId=${user.businessId}&userId=${user.id}`
      );
      const result = z.array(InventorySchema).safeParse(data.inventory);
      if (!result.success) throw new Error("Invalid inventory data");
      return result.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const lowStockQuery = useQuery({
    queryKey: ["inventory-low-stock", user?.businessId, user?.id],
    queryFn: async () => {
      if (!user?.businessId || !user?.id) return [];
      const { data } = await axios.get(
        `/api/inventory/low-stock?businessId=${user.businessId}&userId=${user.id}`
      );
      return data.lowStock;
    },
    staleTime: 1000 * 60 * 10,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", user?.businessId, user?.id],
    queryFn: async () => {
      if (!user?.businessId || !user?.id) return [];
      const { data } = await axios.get(
        `/api/categories?businessId=${user.businessId}&userId=${user.id}`
      );
      return data.categories;
    },
    staleTime: 1000 * 60 * 10,
  });

  const refetchAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["inventory", user?.businessId, user?.id],
      }),
      queryClient.invalidateQueries({
        queryKey: ["categories", user?.businessId, user?.id],
      }),
      queryClient.invalidateQueries({
        queryKey: ["inventory-low-stock", user?.businessId, user?.id],
      }),
    ]);
  };

  const addCategory = useMutation({
    mutationFn: async (payload: {
      name: string;
      businessId: string;
      userId: string;
      newCategory?: string;
    }) => {
      const { data } = await axios.post("/api/categories", {
        name: payload.newCategory || payload.name,
        businessId: payload.businessId,
        userId: payload.userId,
      });
      return data.category;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["categories", user?.businessId, user?.id],
      }),
  });

  const renameCategory = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      axios.put(`/api/categories/${id}`, {
        name,
        userId: user?.id,
        businessId: user?.businessId,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["categories", user?.businessId, user?.id],
      }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) =>
      axios.delete(`/api/categories/${id}`, {
        data: {
          userId: user?.id,
          businessId: user?.businessId,
        },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["categories", user?.businessId, user?.id],
      }),
  });

  const addItem = useMutation({
    mutationFn: async (payload: {
      name: string;
      quantity: number;
      categoryId: string;
      businessId: string;
      userId: string;
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
      businessId: string;
      userId: string;
    }) => {
      await axios.put(`/api/inventory/${payload.id}`, payload);
    },
    onSuccess: refetchAll,
  });

  const deleteItem = useMutation({
    mutationFn: async (payload: {
      id: string;
      businessId: string;
      userId: string;
    }) =>
      axios.delete(`/api/inventory/${payload.id}`, {
        data: payload,
      }),
    onSuccess: refetchAll,
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
            const items = results.data;
            if (!Array.isArray(items) || !businessId || !userId) {
              reject(new Error("Invalid import data"));
              return;
            }
            await axios.post("/api/inventory/import", {
              items,
              businessId,
              userId,
            });
            resolve();
          },
          error: (err: any) => reject(err),
        });
      });
    },
    onSuccess: refetchAll,
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
      const sheet = workbook.worksheets[0];
      const rows: any[] = [];
      sheet.eachRow((row, idx) => {
        if (idx === 1) return;
        const [name, quantity, categoryId] = (row.values as any[]).slice(1);
        if (name && categoryId) {
          rows.push({
            name,
            quantity: quantity ? parseInt(String(quantity)) : 0,
            categoryId,
          });
        }
      });
      if (!rows.length) throw new Error("No valid Excel rows found");
      await axios.post("/api/inventory/import", {
        items: rows,
        businessId,
        userId,
      });
    },
    onSuccess: refetchAll,
  });

  function exportCSV(items: any[], label = "Inventory") {
    if (!items.length) return;
    const exportable = items.map((item) => ({
      Name: item.name,
      Quantity: item.quantity,
      Category: item.category?.name.toUpperCase() || "",
    }));
    const csv = Papa.unparse(exportable);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportExcel(items: any[], label = "Inventory") {
    if (!items.length) return;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(label);
    worksheet.addRow(["Name", "Quantity", "Category"]);
    items.forEach((item) =>
      worksheet.addRow([
        item.name,
        item.quantity,
        item.category?.name.toUpperCase() || "",
      ])
    );
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

  return {
    inventory: inventoryQuery.data,
    isLoading: inventoryQuery.isLoading,
    lowStock: lowStockQuery.data,
    isLowStockLoading: lowStockQuery.isLoading,
    categories: categoriesQuery.data,
    isCategoriesLoading: categoriesQuery.isLoading,
    addCategory,
    renameCategory,
    deleteCategory,
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
