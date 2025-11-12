import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { InventorySchema } from "../types/inventory";
import { z } from "zod";

export function findSimilarCategory(categories: any[], searchName: string) {
  const normalized = searchName.trim().toLowerCase();
  return categories.find((cat) => cat.name.toLowerCase() === normalized);
}

export function useInventory() {
  const queryClient = useQueryClient();

  const inventoryQuery = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data } = await axios.get("/api/inventory");
      const result = z.array(InventorySchema).safeParse(data.inventory);
      if (!result.success) throw new Error("Invalid inventory data");
      return result.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const lowStockQuery = useQuery({
    queryKey: ["inventory-low-stock"],
    queryFn: async () => {
      const { data } = await axios.get("/api/inventory/low-stock");
      const result = z.array(InventorySchema).safeParse(data.lowStock);
      if (!result.success) throw new Error("Invalid low stock data");
      return result.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await axios.get("/api/categories");
      return data.categories;
    },
    staleTime: 1000 * 60 * 10,
  });

  const refetchAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["inventory"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-low-stock"] }),
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
    ]);
  };

  const addCategory = useMutation({
    mutationFn: async (payload: { name: string; newCategory?: string }) => {
      const categoryName = payload.newCategory || payload.name;
      const { data } = await axios.post("/api/categories", {
        name: categoryName,
      });
      return data.category;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const renameCategory = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      axios.put(`/api/categories/${id}`, { name }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => axios.delete(`/api/categories/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const addItem = useMutation({
    mutationFn: async (payload: {
      name: string;
      quantity: number;
      categoryId: string;
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
    mutationFn: async (payload: { id: string }) =>
      axios.delete(`/api/inventory/${payload.id}`),
    onSuccess: refetchAll,
  });

  const importCSV = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      return new Promise<void>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results: any) => {
            try {
              const categories = categoriesQuery.data ?? [];
              const items = [];

              for (const row of results.data) {
                const categoryName = row.Category || row.category;
                const name = row.Name || row.name;
                const quantity = row.Quantity || row.quantity;

                if (!name || !categoryName) continue;

                let category = findSimilarCategory(categories, categoryName);

                if (!category) {
                  const res = await axios.post("/api/categories", {
                    name: categoryName,
                  });
                  category = res.data.category;
                  categories.push(category);
                }

                items.push({
                  name,
                  quantity: quantity ? parseInt(quantity) : 0,
                  categoryId: category.id,
                });
              }

              if (!items.length) throw new Error("No valid items found in CSV");

              await axios.post("/api/inventory/import", { items });
              resolve();
            } catch (err: any) {
              reject(err);
            }
          },
          error: (err: any) => reject(err),
        });
      });
    },
    onSuccess: refetchAll,
  });

  const importExcel = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];

      const categories = categoriesQuery.data ?? [];
      const items: any[] = [];

      worksheet.eachRow(async (row, rowNumber) => {
        if (rowNumber === 1) return;

        const name = row.getCell(1).value;
        const categoryName = row.getCell(2).value;
        const quantity = row.getCell(3).value;

        if (!name || !categoryName) return;

        let category = findSimilarCategory(categories, String(categoryName));

        if (!category) {
          const res = await axios.post("/api/categories", {
            name: String(categoryName),
          });
          category = res.data.category;
          categories.push(category);
        }

        items.push({
          name: String(name),
          quantity: quantity ? parseInt(String(quantity)) : 0,
          categoryId: category.id,
        });
      });

      if (!items.length) throw new Error("No valid items found in Excel file");

      await axios.post("/api/inventory/import", { items });
    },
    onSuccess: refetchAll,
  });

  function exportCSV(items: any[], label = "Inventory") {
    if (!items.length) throw new Error("No inventory to export");

    const exportData = items.map((item) => ({
      Name: item.name,
      Category: item.category?.name ?? "",
      Quantity: item.quantity,
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportExcel(items: any[], label = "Inventory") {
    if (!items.length) throw new Error("No inventory to export");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Inventory");

    worksheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Category", key: "category", width: 20 },
      { header: "Quantity", key: "quantity", width: 15 },
    ];

    items.forEach((item) =>
      worksheet.addRow({
        name: item.name,
        category: item.category?.name ?? "",
        quantity: item.quantity,
      })
    );

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
    categories: categoriesQuery.data,
    lowStock: lowStockQuery.data,
    isLowStockLoading: lowStockQuery.isLoading,
    refetchLowStock: () =>
      queryClient.invalidateQueries({ queryKey: ["inventory-low-stock"] }),
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
  };
}
