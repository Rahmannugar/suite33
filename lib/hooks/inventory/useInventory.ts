import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { InventorySchema } from "@/lib/types/inventory";
import { z } from "zod";

export function findSimilarCategory(categories: any[], searchName: string) {
  const normalized = searchName.trim().toLowerCase();
  return categories.find((cat) => cat.name.toLowerCase() === normalized);
}

export function useInventory(opts?: {
  page?: number;
  perPage?: number;
  categoryId?: string;
  search?: string;

  catPage?: number;
  catPerPage?: number;

  lowPage?: number;
  lowPerPage?: number;
}) {
  const queryClient = useQueryClient();

  const {
    page = 1,
    perPage = 10,
    categoryId,
    search = "",

    catPage = 1,
    catPerPage = 10,

    lowPage = 1,
    lowPerPage = 10,
  } = opts || {};

  const inventoryQuery = useQuery({
    queryKey: ["inventory", page, perPage, categoryId, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("perPage", String(perPage));
      if (categoryId) params.append("categoryId", categoryId);
      if (search.trim()) params.append("search", search.trim().toLowerCase());

      const { data } = await axios.get(`/api/inventory?${params.toString()}`);
      const parsed = z.array(InventorySchema).safeParse(data.inventory);
      if (!parsed.success) throw new Error("Invalid inventory data");

      return { inventory: parsed.data, pagination: data.pagination };
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const lowStockQuery = useQuery({
    queryKey: ["inventory-low-stock", lowPage, lowPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(lowPage));
      params.append("perPage", String(lowPerPage));

      const { data } = await axios.get(
        `/api/inventory/low-stock?${params.toString()}`
      );

      const parsed = z.array(InventorySchema).safeParse(data.lowStock);
      if (!parsed.success) throw new Error("Invalid low stock data");

      return { lowStock: parsed.data, pagination: data.pagination };
    },
    staleTime: 1000 * 60 * 10,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", catPage, catPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(catPage));
      params.append("perPage", String(catPerPage));

      const { data } = await axios.get(`/api/categories?${params.toString()}`);
      return { categories: data.categories, pagination: data.pagination };
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

  const refetchLowStock = () =>
    queryClient.invalidateQueries({ queryKey: ["inventory-low-stock"] });

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
    }) => axios.post("/api/inventory", payload),
    onSuccess: refetchAll,
  });

  const editItem = useMutation({
    mutationFn: async (payload: {
      id: string;
      name: string;
      quantity: number;
      categoryId: string;
    }) => axios.put(`/api/inventory/${payload.id}`, payload),
    onSuccess: refetchAll,
  });

  const deleteItem = useMutation({
    mutationFn: async ({ id }: { id: string }) =>
      axios.delete(`/api/inventory/${id}`),
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
              const localCats = categoriesQuery.data?.categories ?? [];
              const items = [];

              for (const row of results.data) {
                const categoryName = row.Category || row.category;
                const name = row.Name || row.name;
                const quantity = row.Quantity || row.quantity;

                if (!name || !categoryName) continue;

                let category = findSimilarCategory(localCats, categoryName);

                if (!category) {
                  const res = await axios.post("/api/categories", {
                    name: categoryName,
                  });
                  category = res.data.category;
                  localCats.push(category);
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
            } catch (err) {
              reject(err);
            }
          },
          error: (err) => reject(err),
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

      const localCats = categoriesQuery.data?.categories ?? [];
      const items: any[] = [];

      worksheet.eachRow(async (row, rowNumber) => {
        if (rowNumber === 1) return;

        const name = row.getCell(1).value;
        const categoryName = row.getCell(2).value;
        const quantity = row.getCell(3).value;

        if (!name || !categoryName) return;

        let category = findSimilarCategory(localCats, String(categoryName));

        if (!category) {
          const res = await axios.post("/api/categories", {
            name: String(categoryName),
          });
          category = res.data.category;
          localCats.push(category);
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
    inventory: inventoryQuery.data?.inventory ?? [],
    inventoryPagination: inventoryQuery.data?.pagination,
    isLoading: inventoryQuery.isLoading,

    lowStock: lowStockQuery.data?.lowStock ?? [],
    lowStockPagination: lowStockQuery.data?.pagination,
    isLowStockLoading: lowStockQuery.isLoading,

    categories: categoriesQuery.data?.categories ?? [],
    categoriesPagination: categoriesQuery.data?.pagination,
    isCategoriesLoading: categoriesQuery.isLoading,

    refetchLowStock,

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
