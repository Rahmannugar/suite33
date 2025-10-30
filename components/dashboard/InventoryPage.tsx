"use client";

import { useState, useMemo } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useInventory } from "@/lib/hooks/useInventory";
import { toast } from "sonner";
import { Inventory } from "@/lib/types/inventory";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function InventoryPage() {
  const user = useAuthStore((state) => state.user);
  const {
    inventory,
    isLoading,
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

  const categories = useMemo(() => {
    if (!inventory) return [];
    const map = new Map<string, { id: string; name: string }>();
    inventory.forEach((item: Inventory) => {
      if (item.category) map.set(item.category.id, item.category);
    });
    return Array.from(map.values());
  }, [inventory]);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [adding, setAdding] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editNewCategory, setEditNewCategory] = useState("");
  const [editing, setEditing] = useState(false);

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const filteredInventory =
    filterCategory === "all"
      ? inventory ?? []
      : (inventory ?? []).filter(
          (item: Inventory) => item.categoryId === filterCategory
        );

  const canMutate = user?.role === "ADMIN" || user?.role === "SUB_ADMIN";

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name || (!categoryId && !newCategory)) return;
    if (!user?.businessId) return;
    setAdding(true);
    try {
      let oldCategoryId = categoryId;
      if (newCategory) {
        const res = await fetch("/api/categories", {
          method: "POST",
          body: JSON.stringify({
            name: newCategory.trim().toLowerCase(),
            businessId: user.businessId,
          }),
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        oldCategoryId = data.category.id;
      }
      await addItem.mutateAsync({
        name,
        quantity: parseInt(quantity) || 0,
        categoryId: oldCategoryId,
        businessId: user.businessId as string,
      });
      toast.success("Item added!");
      setName("");
      setQuantity("");
      setCategoryId("");
      setNewCategory("");
      refetchLowStock();
    } catch {
      toast.error("Failed to add item");
    } finally {
      setAdding(false);
    }
  }

  async function handleEditItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editId || !editName || (!editCategoryId && !editNewCategory)) return;
    setEditing(true);
    try {
      let oldCategoryId = editCategoryId;
      if (editNewCategory) {
        const res = await fetch("/api/categories", {
          method: "POST",
          body: JSON.stringify({
            name: editNewCategory.trim().toLowerCase(),
            businessId: user?.businessId,
          }),
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        oldCategoryId = data.category.id;
      }
      await editItem.mutateAsync({
        id: editId,
        name: editName,
        quantity: parseInt(editQuantity) || 0,
        categoryId: oldCategoryId,
      });
      toast.success("Item updated!");
      setEditId(null);
      setEditName("");
      setEditQuantity("");
      setEditCategoryId("");
      setEditNewCategory("");
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
      refetchLowStock();
    } catch {
      toast.error("Failed to delete item");
    }
  }

  function handleExportCSV() {
    exportCSV(filteredInventory);
  }
  async function handleExportExcel() {
    await exportExcel(filteredInventory);
  }
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.businessId) return;
    await importCSV.mutateAsync({ file, businessId: user.businessId });
    toast.success("Imported CSV!");
    refetchLowStock();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Inventory</h2>
      <div className="flex gap-2 mb-4 items-center">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="max-w-xs w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium">
            <SelectValue>
              {filterCategory === "all"
                ? "All Categories"
                : categories
                    .find((cat) => cat.id === filterCategory)
                    ?.name.toUpperCase() ?? ""}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          className="px-3 py-2 rounded border border-[--input] bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition"
          onClick={handleExportCSV}
        >
          Export CSV
        </button>
        <button
          type="button"
          className="px-3 py-2 rounded border border-[--input] bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition"
          onClick={handleExportExcel}
        >
          Export Excel
        </button>
        <label className="px-3 py-2 rounded border border-[--input] bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition cursor-pointer">
          Import CSV
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
        </label>
      </div>
      {canMutate && (
        <form onSubmit={handleAddItem} className="flex gap-2 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full max-w-xs rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="block w-full max-w-xs rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
            required
          />
          <input
            type="text"
            placeholder="New category (optional)"
            value={newCategory}
            onChange={(e) => {
              setNewCategory(e.target.value);
              if (e.target.value) setCategoryId("");
            }}
            className="block w-full max-w-xs rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
            disabled={!!categoryId}
          />
          <Select
            value={categoryId}
            onValueChange={(v) => {
              setCategoryId(v);
              if (v) setNewCategory("");
            }}
            disabled={!!newCategory}
          >
            <SelectTrigger className="max-w-xs w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium">
              <SelectValue>
                {categoryId
                  ? categories
                      .find((cat) => cat.id === categoryId)
                      ?.name.toUpperCase()
                  : "Select category"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            disabled={adding}
          >
            {adding ? "Adding..." : "Add Item"}
          </button>
        </form>
      )}
      {isLoading ? (
        <div>Loading inventory...</div>
      ) : filteredInventory.length ? (
        <table className="w-full border rounded">
          <thead>
            <tr>
              <th>Name</th>
              <th>Quantity</th>
              <th>Category</th>
              {canMutate && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item: Inventory) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{item.category?.name?.toUpperCase() ?? "-"}</td>
                {canMutate && (
                  <td>
                    <button
                      className="text-blue-600 hover:underline mr-2"
                      onClick={() => {
                        setEditId(item.id);
                        setEditName(item.name);
                        setEditQuantity(item.quantity.toString());
                        setEditCategoryId(item.categoryId);
                        setEditNewCategory("");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline"
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
          Inventory is empty.
        </div>
      )}
      {/* Edit Modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-blue-900/40 rounded-lg p-6 shadow-lg w-full max-w-sm">
            <form onSubmit={handleEditItem} className="space-y-4">
              <input
                type="text"
                placeholder="Item name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
              <input
                type="number"
                placeholder="Quantity"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
              <input
                type="text"
                placeholder="New category (optional)"
                value={editNewCategory}
                onChange={(e) => {
                  setEditNewCategory(e.target.value);
                  if (e.target.value) setEditCategoryId("");
                }}
                className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                disabled={!!editCategoryId}
              />
              <Select
                value={editCategoryId}
                onValueChange={(v) => {
                  setEditCategoryId(v);
                  if (v) setEditNewCategory("");
                }}
                disabled={!!editNewCategory}
              >
                <SelectTrigger className="w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium">
                  <SelectValue>
                    {editCategoryId
                      ? categories
                          .find((cat) => cat.id === editCategoryId)
                          ?.name.toUpperCase()
                      : "Select category"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                  disabled={editing}
                >
                  {editing ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                  onClick={() => setEditId(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Low Stock Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Low Stock Items</h3>
        {isLowStockLoading ? (
          <div>Loading low stock...</div>
        ) : lowStock?.length ? (
          <ul className="space-y-1">
            {lowStock.map((item: Inventory) => (
              <li
                key={item.id}
                className="flex justify-between items-center px-3 py-2 rounded bg-red-50 dark:bg-red-900/30"
              >
                <span>
                  {item.name} ({item.quantity}) -{" "}
                  {item.category?.name?.toUpperCase() ?? "-"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-[--muted-foreground]">
            No low stock items.
          </div>
        )}
      </div>
    </div>
  );
}
