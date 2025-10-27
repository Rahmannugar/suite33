"use client";

import { useInventory } from "@/lib/hooks/useInventory";
import { useAuthStore } from "@/lib/stores/authStore";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { Inventory } from "@/lib/types/inventory";

export default function InventoryTable() {
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

  // Extract unique categories from inventory data
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
  const [adding, setAdding] = useState(false);

  // Edit modal state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editing, setEditing] = useState(false);

  // Filter by category
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
    if (!name || !categoryId) return;
    if (!user?.businessId) return;
    setAdding(true);
    try {
      await addItem.mutateAsync({
        name,
        quantity: parseInt(quantity) || 0,
        categoryId,
        businessId: user.businessId as string,
      });
      toast.success("Item added!");
      setName("");
      setQuantity("");
      setCategoryId("");
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

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Inventory</h2>
      <div className="flex gap-2 mb-4 items-center">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="max-w-xs w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      {canMutate && (
        <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
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
            required
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border rounded px-3 py-2"
            required
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
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
                <td>{item.category?.name ?? "-"}</td>
                {canMutate && (
                  <td>
                    <button
                      className="text-blue-600 mr-2"
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
                      className="text-red-600"
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
              <label className="block text-sm font-medium">Edit Item</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="border rounded px-3 py-2 w-full"
              />
              <input
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                required
                className="border rounded px-3 py-2 w-full"
              />
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                required
                className="border rounded px-3 py-2 w-full"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  className="px-4 py-2 rounded bg-gray-200"
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
