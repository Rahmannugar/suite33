"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Plus,
  FileDown,
  FileUp,
  Trash2,
  Edit,
  AlertTriangle,
} from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export default function InventoryPage() {
  const user = useAuthStore((s) => s.user);
  const {
    inventory,
    isLoading,
    categories,
    addCategory,
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
  } = useInventory(
    user?.businessId ? { businessId: user.businessId } : undefined
  );

  const canMutate = user?.role === "ADMIN" || user?.role === "SUB_ADMIN";

  const [page, setPage] = useState(1);
  const perPage = 10;
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [deletingItem, setDeletingItem] = useState<Inventory | null>(null);
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    categoryId: "none",
    newCategory: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () =>
    setForm({ name: "", quantity: "", categoryId: "none", newCategory: "" });

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + "…" : text;

  useEffect(() => {
    setPage(1);
  }, [filterCategory, search]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredInventory = useMemo(() => {
    const base = inventory ?? [];
    return base.filter((item) => {
      const byCat =
        filterCategory === "all" || item.categoryId === filterCategory;
      const bySearch =
        !normalizedSearch || item.name.toLowerCase().includes(normalizedSearch);
      return byCat && bySearch;
    });
  }, [inventory, filterCategory, normalizedSearch]);

  const totalRecords = filteredInventory.length;
  const totalPages = Math.ceil(totalRecords / perPage);
  const paginatedItems = filteredInventory.slice(
    (page - 1) * perPage,
    page * perPage
  );

  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.businessId) return;
    const isCSV = file.name.toLowerCase().endsWith(".csv");

    try {
      if (isCSV) {
        await importCSV.mutateAsync({ file, businessId: user.businessId });
      } else {
        await importExcel.mutateAsync({ file, businessId: user.businessId });
      }
      toast.success("Inventory imported successfully");
      refetchLowStock();
    } catch {
      toast.error("Failed to import inventory");
    } finally {
      e.currentTarget.value = "";
    }
  }

  async function handleAddItem() {
    if (!form.name) return toast.error("Enter an item name.");
    if (form.categoryId === "none" && !form.newCategory)
      return toast.error("Choose a category or enter a new one.");
    if (form.categoryId !== "none" && form.newCategory)
      return toast.error("Select only one category.");

    setSaving(true);
    try {
      let catId = form.categoryId === "none" ? "" : form.categoryId;
      if (form.newCategory) {
        const newCat = await addCategory.mutateAsync({
          name: form.newCategory.trim().toLowerCase(),
          businessId: user?.businessId ?? "",
        });
        catId = newCat.id;
      }
      await addItem.mutateAsync({
        name: form.name,
        quantity: parseInt(form.quantity) || 0,
        categoryId: catId,
        businessId: user?.businessId ?? "",
      });
      toast.success("Item added");
      resetForm();
      setOpenAdd(false);
      refetchLowStock();
    } catch {
      toast.error("Failed to add item");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditItem() {
    if (!editingItem) return;
    if (form.categoryId !== "none" && form.newCategory)
      return toast.error("Select only one — category or new.");

    setSaving(true);
    try {
      let catId = form.categoryId === "none" ? "" : form.categoryId;
      if (form.newCategory) {
        const newCat = await addCategory.mutateAsync({
          name: form.newCategory.trim().toLowerCase(),
          businessId: user?.businessId ?? "",
        });
        catId = newCat.id;
      }
      await editItem.mutateAsync({
        id: editingItem.id,
        name: form.name,
        quantity: parseInt(form.quantity) || 0,
        categoryId: catId,
      });
      toast.success("Item updated");
      resetForm();
      setEditingItem(null);
      setOpenEdit(false);
      refetchLowStock();
    } catch {
      toast.error("Failed to update item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem() {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await deleteItem.mutateAsync(deletingItem.id);
      toast.success("Item deleted");
      refetchLowStock();
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setDeleting(false);
      setDeletingItem(null);
      setOpenDelete(false);
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
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

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search items by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={handleImportChange}
            />
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp size={16} /> Import CSV/Excel
            </Button>
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => exportCSV(filteredInventory)}
            >
              <FileDown size={16} /> Export CSV
            </Button>
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => exportExcel(filteredInventory)}
            >
              <FileDown size={16} /> Export Excel
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : totalRecords > 0 ? (
              <>
                <table className="w-full border rounded">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left">S/N</th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Quantity</th>
                      <th className="p-3 text-left">Category</th>
                      {canMutate && <th className="p-3 text-left">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item, i) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">{(page - 1) * perPage + i + 1}</td>
                        <td className="p-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-block max-w-[220px] truncate">
                                {truncate(item.name, 20)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{item.name}</TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-block max-w-[200px] truncate">
                                {truncate(
                                  item.category?.name.toUpperCase() ?? "-",
                                  15
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {item.category?.name ?? "-"}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        {canMutate && (
                          <td className="p-3 flex gap-2">
                            <Button
                              className="cursor-pointer"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingItem(item);
                                setForm({
                                  name: item.name,
                                  quantity: item.quantity.toString(),
                                  categoryId: item.categoryId || "none",
                                  newCategory: "",
                                });
                                setOpenEdit(true);
                              }}
                            >
                              <Edit size={14} /> Edit
                            </Button>
                            <Button
                              className="cursor-pointer"
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setDeletingItem(item);
                                setOpenDelete(true);
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
              <p className="text-sm text-muted-foreground">No items found.</p>
            )}
          </CardContent>
        </Card>

        {!isLowStockLoading && lowStock?.length > 0 && (
          <Card className="mt-6 border-red-200 dark:border-red-950/50 bg-red-50/50 dark:bg-red-950/10">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle size={18} /> Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {lowStock.map((item: Inventory, i: number) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center px-3 py-2 rounded bg-red-100/40 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                >
                  <span className="font-medium">
                    {i + 1}. {item.name} (
                    {item.category?.name.toUpperCase() ?? "-"}) –{" "}
                    {item.quantity} left
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Dialog
          open={openAdd}
          onOpenChange={(open) => {
            if (!open) resetForm();
            !saving && setOpenAdd(open);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Item</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Item name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <Input
              placeholder="New category (optional)"
              value={form.newCategory}
              onChange={(e) =>
                setForm({ ...form, newCategory: e.target.value })
              }
            />
            <Select
              value={form.categoryId}
              onValueChange={(v) => setForm({ ...form, categoryId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={() => setOpenAdd(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                className="cursor-pointer"
                onClick={handleAddItem}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={openEdit}
          onOpenChange={(open) => {
            if (!open) resetForm();
            setEditingItem(null);
            !saving && setOpenEdit(open);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Item name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <Input
              placeholder="New category (optional)"
              value={form.newCategory}
              onChange={(e) =>
                setForm({ ...form, newCategory: e.target.value })
              }
            />
            <Select
              value={form.categoryId}
              onValueChange={(v) => setForm({ ...form, categoryId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={() => setOpenEdit(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleEditItem} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={openDelete}
          onOpenChange={(o) => !deleting && setOpenDelete(o)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Item</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this item? This action cannot be
              undone.
            </p>
            <DialogFooter>
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={() => setOpenDelete(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                className="cursor-pointer"
                variant="destructive"
                onClick={handleDeleteItem}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
