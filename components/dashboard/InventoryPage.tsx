"use client";

import { useState, useMemo, useRef } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useInventory } from "@/lib/hooks/useInventory";
import { toast } from "sonner";
import type { Inventory } from "@/lib/types/inventory";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileDown, FileUp, Trash2, Edit } from "lucide-react";

export default function InventoryPage() {
  const user = useAuthStore((s) => s.user);
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

  const canMutate = user?.role === "ADMIN" || user?.role === "SUB_ADMIN";

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Filtering
  const [filterCategory, setFilterCategory] = useState("all");

  const categories = useMemo(() => {
    if (!inventory) return [];
    const map = new Map<string, { id: string; name: string }>();
    inventory.forEach((item: Inventory) => {
      if (item.category) map.set(item.category.id, item.category);
    });
    return Array.from(map.values());
  }, [inventory]);

  // Sorting & Filtering
  const filteredInventory = useMemo(() => {
    const sorted =
      inventory
        ?.filter((item) =>
          filterCategory === "all" ? true : item.categoryId === filterCategory
        )
        ?.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ) ?? [];
    return sorted;
  }, [inventory, filterCategory]);

  const totalRecords = filteredInventory.length;
  const totalPages = Math.ceil(totalRecords / perPage);
  const paginatedItems = filteredInventory.slice(
    (page - 1) * perPage,
    page * perPage
  );

  // Add/Edit Dialog States
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);

  const [form, setForm] = useState({
    name: "",
    quantity: "",
    categoryId: "",
    newCategory: "",
  });
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !user?.businessId) return;
    const promise = f.name.toLowerCase().endsWith(".csv")
      ? importCSV.mutateAsync({ file: f, businessId: user.businessId })
      : importExcel.mutateAsync({ file: f, businessId: user.businessId });
    promise
      .then(() => {
        toast.success("Inventory imported successfully");
        refetchLowStock();
      })
      .catch(() => toast.error("Failed to import inventory"))
      .finally(() => (e.currentTarget.value = ""));
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Inventory</h2>
        {canMutate && (
          <Button
            onClick={() => setOpenAdd(true)}
            className="gap-2 cursor-pointer"
          >
            <Plus size={16} /> Add Item
          </Button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full md:w-auto">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by Category">
                {filterCategory === "all"
                  ? "All Categories"
                  : categories.find((c) => c.id === filterCategory)?.name ??
                    "All Categories"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:flex lg:items-center lg:justify-end">
          {canMutate && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={handleImportChange}
              />
              <Button
                variant="outline"
                onClick={handleImportClick}
                className="whitespace-nowrap w-full md:w-auto gap-2 cursor-pointer"
              >
                <FileUp size={16} /> Import CSV/Excel
              </Button>

              <Button
                variant="outline"
                className="whitespace-nowrap w-full md:w-auto gap-2 cursor-pointer"
                onClick={() => {
                  exportCSV(filteredInventory);
                  toast.success("CSV exported successfully");
                }}
              >
                <FileDown size={16} /> Export CSV
              </Button>

              <Button
                variant="outline"
                className="whitespace-nowrap w-full md:w-auto gap-2 cursor-pointer"
                onClick={() => {
                  exportExcel(filteredInventory);
                  toast.success("Excel exported successfully");
                }}
              >
                <FileDown size={16} /> Export Excel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base font-semibold">
            Inventory Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : totalRecords > 0 ? (
            <>
              <table className="w-full border rounded">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">S/N</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Quantity</th>
                    <th className="text-left p-3">Category</th>
                    {canMutate && <th className="text-left p-3">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item, i) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3">{(page - 1) * perPage + i + 1}</td>
                      <td className="p-3">{item.name}</td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3">
                        {item.category?.name?.toUpperCase() ?? "-"}
                      </td>
                      {canMutate && (
                        <td className="p-3 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 cursor-pointer"
                            onClick={() => {
                              setEditingItem(item);
                              setForm({
                                name: item.name,
                                quantity: item.quantity.toString(),
                                categoryId: item.categoryId,
                                newCategory: "",
                              });
                              setOpenEdit(true);
                            }}
                          >
                            <Edit size={14} /> Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1 cursor-pointer"
                            onClick={async () => {
                              try {
                                await deleteItem.mutateAsync(item.id);
                                toast.success("Item deleted");
                              } catch {
                                toast.error("Failed to delete item");
                              }
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => setPage(i + 1)}
                          isActive={page === i + 1}
                          className="cursor-pointer"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Inventory is empty.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Section */}
      {!isLowStockLoading && lowStock?.length > 0 && (
        <Card className="mt-6 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-300">
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {lowStock.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center px-3 py-2 rounded bg-blue-50 dark:bg-blue-900/20"
              >
                <span>
                  {item.name} ({item.quantity}) -{" "}
                  {item.category?.name?.toUpperCase() ?? "-"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={openAdd} onOpenChange={(o) => !saving && setOpenAdd(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
          </DialogHeader>

          <input
            type="text"
            placeholder="Item name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded-lg px-3 py-2 w-full"
          />
          <input
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="border rounded-lg px-3 py-2 w-full"
          />
          <input
            type="text"
            placeholder="New category (optional)"
            value={form.newCategory}
            onChange={(e) => {
              const val = e.target.value;
              setForm({
                ...form,
                newCategory: val,
                categoryId: val ? "" : form.categoryId,
              });
            }}
            className="border rounded-lg px-3 py-2 w-full"
            disabled={!!form.categoryId}
          />
          <Select
            value={form.categoryId}
            onValueChange={(v) =>
              setForm({ ...form, categoryId: v, newCategory: "" })
            }
            disabled={!!form.newCategory}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenAdd(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!form.name || (!form.categoryId && !form.newCategory))
                  return;
                setSaving(true);
                try {
                  let catId = form.categoryId;
                  if (form.newCategory) {
                    const res = await fetch("/api/categories", {
                      method: "POST",
                      body: JSON.stringify({
                        name: form.newCategory.trim().toLowerCase(),
                        businessId: user?.businessId,
                      }),
                      headers: { "Content-Type": "application/json" },
                    });
                    const data = await res.json();
                    catId = data.category.id;
                  }
                  await addItem.mutateAsync({
                    name: form.name,
                    quantity: parseInt(form.quantity) || 0,
                    categoryId: catId,
                    businessId: user?.businessId ?? "",
                  });
                  toast.success("Item added");
                  setOpenAdd(false);
                  setForm({
                    name: "",
                    quantity: "",
                    categoryId: "",
                    newCategory: "",
                  });
                } catch {
                  toast.error("Failed to add item");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={(o) => !saving && setOpenEdit(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>

          <input
            type="text"
            placeholder="Item name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded-lg px-3 py-2 w-full"
          />
          <input
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="border rounded-lg px-3 py-2 w-full"
          />
          <input
            type="text"
            placeholder="New category (optional)"
            value={form.newCategory}
            onChange={(e) => {
              const val = e.target.value;
              setForm({
                ...form,
                newCategory: val,
                categoryId: val ? "" : form.categoryId,
              });
            }}
            className="border rounded-lg px-3 py-2 w-full"
            disabled={!!form.categoryId}
          />
          <Select
            value={form.categoryId}
            onValueChange={(v) =>
              setForm({ ...form, categoryId: v, newCategory: "" })
            }
            disabled={!!form.newCategory}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenEdit(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!editingItem) return;
                setSaving(true);
                try {
                  let catId = form.categoryId;
                  if (form.newCategory) {
                    const res = await fetch("/api/categories", {
                      method: "POST",
                      body: JSON.stringify({
                        name: form.newCategory.trim().toLowerCase(),
                        businessId: user?.businessId,
                      }),
                      headers: { "Content-Type": "application/json" },
                    });
                    const data = await res.json();
                    catId = data.category.id;
                  }
                  await editItem.mutateAsync({
                    id: editingItem.id,
                    name: form.name,
                    quantity: parseInt(form.quantity) || 0,
                    categoryId: catId,
                  });
                  toast.success("Item updated");
                  setOpenEdit(false);
                  setEditingItem(null);
                } catch {
                  toast.error("Failed to update item");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
