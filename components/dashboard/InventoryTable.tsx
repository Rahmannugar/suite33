"use client";

import { useAuthStore } from "@/lib/stores/authStore";
import { useInventory } from "@/lib/hooks/useInventory";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export function InventoryTable({ categories }: { categories: any[] }) {
  const user = useAuthStore((s) => s.user);
  const {
    inventory,
    isLoading,
    refetch,
    addItem,
    editItem,
    deleteItem,
    importCSV,
    importExcel,
    exportCSV,
    exportExcel,
    lowStock,
    isLowStockLoading,
    refetchLowStock,
  } = useInventory();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [adding, setAdding] = useState(false);

  // Edit modal state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editing, setEditing] = useState(false);

  // Filter by category
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Import
  const [importing, setImporting] = useState(false);

  const canMutate = user?.role === "ADMIN" || user?.role === "SUB_ADMIN";

  const filteredInventory =
    filterCategory === "all"
      ? inventory ?? []
      : (inventory ?? []).filter(
          (item: any) => item.categoryId === filterCategory
        );

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !categoryId) return;
    if (!user?.businessId) return;
    setAdding(true);
    try {
      await addItem.mutateAsync({
        name,
        quantity: parseInt(quantity) || 0,
        categoryId,
        businessId: user.businessId,
      });
      toast.success("Item added!");
      setName("");
      setQuantity("");
      setCategoryId(categories[0]?.id ?? "");
      refetch();
      refetchLowStock();
    } catch {
      toast.error("Failed to add item");
    } finally {
      setAdding(false);
    }
  }

  async function handleEditItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editId || !editName || !editCategoryId) return;
    setEditing(true);
    try {
      await editItem.mutateAsync({
        id: editId,
        name: editName,
        quantity: parseInt(editQuantity) || 0,
        categoryId: editCategoryId,
      });
      toast.success("Item updated!");
      setEditId(null);
      setEditName("");
      setEditQuantity("");
      setEditCategoryId("");
      refetch();
      refetchLowStock();
    } catch {
      toast.error("Failed to update item");
    } finally {
      setEditing(false);
    }
  }

  async function handleDeleteItem(id: string) {
    try {
      await deleteItem.mutateAsync(id);
      toast.success("Item deleted!");
      refetch();
      refetchLowStock();
    } catch {
      toast.error("Failed to delete item");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      if (file.name.endsWith(".csv")) {
        await importCSV.mutateAsync({ file, businessId: user?.businessId });
      } else if (file.name.endsWith(".xlsx")) {
        await importExcel.mutateAsync({ file, businessId: user?.businessId });
      } else {
        toast.error("Unsupported file type");
      }
      toast.success("Inventory imported!");
      refetch();
      refetchLowStock();
    } catch (err: any) {
      toast.error(err?.message || "Failed to import inventory");
    } finally {
      setImporting(false);
    }
  }

  function handleExportCSV() {
    exportCSV(filteredInventory);
  }

  async function handleExportExcel() {
    await exportExcel(filteredInventory);
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Inventory</h2>
      {/* Low stock alert */}
      {isLowStockLoading ? (
        <div>Checking low stock...</div>
      ) : lowStock?.length ? (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded text-yellow-900">
          <strong>Low Stock Alert:</strong>{" "}
          {lowStock.map((item: any) => (
            <span key={item.id} className="mr-3">
              {item.name} ({item.quantity} left)
            </span>
          ))}
        </div>
      ) : null}
      {/* Filter controls */}
      <div className="flex gap-2 mb-4 items-center">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="all">All Categories</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {canMutate && (
          <>
            <label className="bg-blue-50 border border-blue-600 px-3 py-1 rounded cursor-pointer">
              {importing ? "Importing..." : "Import CSV/Excel"}
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              type="button"
              className="bg-blue-50 border border-blue-600 px-3 py-1 rounded cursor-pointer"
              onClick={handleExportCSV}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="bg-blue-50 border border-blue-600 px-3 py-1 rounded cursor-pointer"
              onClick={handleExportExcel}
            >
              Export Excel
            </button>
          </>
        )}
      </div>
      {/* Add item */}
      {canMutate && (
        <form onSubmit={handleAddItem} className="flex gap-2 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="border rounded px-3 py-2"
            min={0}
            required
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border rounded px-3 py-2"
            required
          >
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={adding}
          >
            {adding ? "Adding..." : "Add Item"}
          </button>
        </form>
      )}
      {/* Table */}
      {isLoading ? (
        <div>Loading inventory...</div>
      ) : filteredInventory.length ? (
        <table className="w-full border rounded">
          <thead>
            <tr className="bg-blue-50 dark:bg-blue-900/40">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Quantity</th>
              <th className="p-2 text-left">Category</th>
              {canMutate && <th className="p-2 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item: any) => (
              <tr key={item.id} className="border-t">
                <td className="p-2">{item.name}</td>
                <td
                  className={`p-2 ${
                    item.quantity < 5 ? "text-red-600 font-bold" : ""
                  }`}
                >
                  {item.quantity}
                </td>
                <td className="p-2">{item.category?.name || "-"}</td>
                {canMutate && (
                  <td className="p-2 flex gap-2">
                    <button
                      className="text-blue-600 text-xs"
                      onClick={() => {
                        setEditId(item.id);
                        setEditName(item.name);
                        setEditQuantity(item.quantity.toString());
                        setEditCategoryId(item.categoryId);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 text-xs"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-sm text-[--muted-foreground] mt-4">
          {canMutate
            ? "Inventory is empty, start adding."
            : "Inventory is empty, please contact admin."}
        </div>
      )}
      {/* Edit Modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-blue-900/40 rounded-lg p-6 shadow-lg w-full max-w-sm">
            <h3 className="font-semibold mb-4">Edit Item</h3>
            <form onSubmit={handleEditItem} className="space-y-4">
              <input
                type="text"
                placeholder="Item name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                required
              />
              <input
                type="number"
                placeholder="Quantity"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                min={0}
                required
              />
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                required
              >
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700"
                  onClick={() => setEditId(null)}
                  disabled={editing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white"
                  disabled={editing}
                >
                  {editing ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
