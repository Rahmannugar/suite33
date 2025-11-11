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
import { AnimatePresence, motion } from "framer-motion";

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
    renameCategory,
    deleteCategory,
    importCSV,
    importExcel,
    exportCSV,
    exportExcel,
    lowStock,
    isLowStockLoading,
    refetchLowStock,
  } = useInventory(
    user ? { businessId: user.businessId ?? undefined, id: user.id } : undefined
  );

  const canMutate = user?.role === "ADMIN" || user?.role === "SUB_ADMIN";

  const [page, setPage] = useState(1);
  const perPage = 10;

  const [catPage, setCatPage] = useState(1);
  const catPerPage = 10;

  const [lowStockPage, setLowStockPage] = useState(1);
  const lowStockPerPage = 10;

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [openRenameCategory, setOpenRenameCategory] = useState(false);
  const [openDeleteCategory, setOpenDeleteCategory] = useState(false);

  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [deletingItem, setDeletingItem] = useState<Inventory | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    quantity: "",
    categoryId: "none",
    newCategory: "",
  });

  const [categoryName, setCategoryName] = useState("");

  const [showCategories, setShowCategories] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () =>
    setForm({ name: "", quantity: "", categoryId: "none", newCategory: "" });

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + "…" : text;

  useEffect(() => setPage(1), [filterCategory, search]);

  useEffect(() => setCatPage(1), [showCategories, categories?.length]);

  useEffect(() => setLowStockPage(1), [lowStock?.length]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredInventory = useMemo(() => {
    const base = inventory ?? [];
    return base
      .filter((item: Inventory) => {
        const byCat =
          filterCategory === "all" || item.categoryId === filterCategory;
        const bySearch =
          !normalizedSearch ||
          item.name.toLowerCase().includes(normalizedSearch);
        return byCat && bySearch;
      })
      .sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      );
  }, [inventory, filterCategory, normalizedSearch]);

  const totalRecords = filteredInventory.length;
  const totalPages = Math.ceil(totalRecords / perPage);
  const paginatedItems = filteredInventory.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const sortedCategories = useMemo(() => {
    return (categories ?? [])
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      );
  }, [categories]);

  const totalCat = sortedCategories.length;
  const totalCatPages = Math.ceil(totalCat / catPerPage);
  const paginatedCategories = sortedCategories.slice(
    (catPage - 1) * catPerPage,
    catPage * catPerPage
  );

  const sortedLowStock = useMemo(() => {
    if (!lowStock) return [];
    return [...lowStock].sort((a, b) => {
      if (a.quantity !== b.quantity) return a.quantity - b.quantity;
      return (
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime()
      );
    });
  }, [lowStock]);

  const totalLowStock = sortedLowStock.length;
  const totalLowStockPages = Math.ceil(totalLowStock / lowStockPerPage);
  const paginatedLowStock = sortedLowStock.slice(
    (lowStockPage - 1) * lowStockPerPage,
    lowStockPage * lowStockPerPage
  );

  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.businessId || !user?.id) return;
    const isCSV = file.name.toLowerCase().endsWith(".csv");
    try {
      if (isCSV) {
        await importCSV.mutateAsync({
          file,
          businessId: user.businessId,
          userId: user.id,
        });
      } else {
        await importExcel.mutateAsync({
          file,
          businessId: user.businessId,
          userId: user.id,
        });
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
      let catId = form.categoryId;

      if (form.categoryId === "none" && form.newCategory) {
        const category = await addCategory.mutateAsync({
          name: form.newCategory.trim(),
          businessId: user?.businessId ?? "",
          userId: user?.id ?? "",
        });
        catId = category.id;
      }
      await addItem.mutateAsync({
        name: form.name,
        quantity: parseInt(form.quantity) || 0,
        categoryId: catId,
        businessId: user?.businessId ?? "",
        userId: user?.id ?? "",
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
    if (!form.name) return toast.error("Enter an item name.");
    if (form.categoryId === "none" && !form.newCategory)
      return toast.error("Choose a category or enter a new one.");
    if (form.categoryId !== "none" && form.newCategory)
      return toast.error("Select only one — category or new.");
    setSaving(true);
    try {
      let catId = form.categoryId === "none" ? "" : form.categoryId;
      if (form.newCategory) {
        const newCat = await addCategory.mutateAsync({
          name: form.newCategory.trim().toLowerCase(),
          businessId: user?.businessId ?? "",
          userId: user?.id ?? "",
        });
        catId = newCat.id;
      }
      await editItem.mutateAsync({
        id: editingItem.id,
        name: form.name,
        quantity: parseInt(form.quantity) || 0,
        categoryId: catId,
        businessId: user?.businessId ?? "",
        userId: user?.id ?? "",
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
      await deleteItem.mutateAsync({
        id: deletingItem.id,
        businessId: user?.businessId ?? "",
        userId: user?.id ?? "",
      });
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

  async function handleRenameCategory() {
    if (!selectedCategory || !categoryName.trim())
      return toast.error("Enter a category name");
    setSaving(true);
    try {
      await renameCategory.mutateAsync({
        id: selectedCategory.id,
        name: categoryName.trim().toLowerCase(),
      });
      toast.success("Category renamed");
      setOpenRenameCategory(false);
      setSelectedCategory(null);
      setCategoryName("");
    } catch {
      toast.error("Failed to rename category");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory() {
    if (!selectedCategory) return;
    setDeleting(true);
    try {
      await deleteCategory.mutateAsync(selectedCategory.id);
      toast.success("Category deleted");
      setOpenDeleteCategory(false);
      setSelectedCategory(null);
    } catch (err: any) {
      if (err.response?.status === 400) {
        toast.error(
          "Cannot delete category in use. Remove or reassign its items first."
        );
      } else {
        toast.error("Failed to delete category");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Inventory</h2>
          {canMutate && (
            <Button
              onClick={() => {
                resetForm();
                setEditingItem(null);
                setOpenAdd(true);
              }}
              className="gap-2 cursor-pointer"
            >
              <Plus size={16} /> Add Item
            </Button>
          )}
        </div>

        <div className="my-4 flex flex-col gap-4">
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
              className="lg:max-w-sm"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {canMutate && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={handleImportChange}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 cursor-pointer w-full"
              >
                <FileUp size={16} /> Import CSV/Excel
              </Button>
              <Button
                variant="outline"
                className="gap-2 cursor-pointer w-full"
                onClick={() => {
                  exportCSV(filteredInventory);
                  toast.success("CSV exported successfully");
                }}
              >
                <FileDown size={16} /> Export CSV
              </Button>
              <Button
                variant="outline"
                className="gap-2 cursor-pointer w-full"
                onClick={() => {
                  exportExcel(filteredInventory);
                  toast.success("Excel exported successfully");
                }}
              >
                <FileDown size={16} /> Export Excel
              </Button>
            </div>
          )}
        </div>

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
                <table className="w-full border rounded text-sm">
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
                              <span className="inline-block max-w-[220px] truncate">
                                {item.category?.name?.toUpperCase() ?? "-"}
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
                              size="sm"
                              variant="outline"
                              className="gap-1 cursor-pointer"
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
                              size="sm"
                              variant="destructive"
                              className="gap-1 cursor-pointer"
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

        {!isLowStockLoading && totalLowStock > 0 && (
          <Card className="mt-6 border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-950/10">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle size={18} /> Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {paginatedLowStock.map((item: Inventory, i: number) => (
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

              {totalLowStockPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setLowStockPage((p) => Math.max(1, p - 1))
                        }
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                    {Array.from({ length: totalLowStockPages }, (_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => setLowStockPage(i + 1)}
                          isActive={lowStockPage === i + 1}
                          className="cursor-pointer"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      {" "}
                      <PaginationNext
                        onClick={() =>
                          setLowStockPage((p) =>
                            Math.min(totalLowStockPages, p + 1)
                          )
                        }
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setShowCategories((v) => !v);
              setCatPage(1);
            }}
            className="cursor-pointer mt-4"
          >
            {showCategories ? "Hide Categories" : "View Categories"}
          </Button>
        </div>

        <AnimatePresence>
          {showCategories && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {totalCat ? (
                    <>
                      <table className="w-full border rounded text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="p-3 text-left">S/N</th>
                            <th className="p-3 text-left">Name</th>
                            {canMutate && (
                              <th className="p-3 text-left">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedCategories.map((c: any, i: number) => (
                            <tr key={c.id} className="border-t">
                              <td className="p-3">
                                {(catPage - 1) * catPerPage + i + 1}
                              </td>
                              <td className="p-3">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-block max-w-[240px] truncate">
                                      {c.name.toUpperCase()}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>{c.name}</TooltipContent>
                                </Tooltip>
                              </td>
                              {canMutate && (
                                <td className="p-3 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={() => {
                                      setSelectedCategory(c);
                                      setCategoryName(c.name);
                                      setOpenRenameCategory(true);
                                    }}
                                  >
                                    Rename
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="cursor-pointer"
                                    onClick={() => {
                                      setSelectedCategory(c);
                                      setOpenDeleteCategory(true);
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {totalCatPages > 1 && (
                        <Pagination className="mt-4">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() =>
                                  setCatPage((p) => Math.max(1, p - 1))
                                }
                                className="cursor-pointer"
                              />
                            </PaginationItem>
                            {Array.from({ length: totalCatPages }, (_, i) => (
                              <PaginationItem key={i}>
                                <PaginationLink
                                  onClick={() => setCatPage(i + 1)}
                                  isActive={catPage === i + 1}
                                  className="cursor-pointer"
                                >
                                  {i + 1}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() =>
                                  setCatPage((p) =>
                                    Math.min(totalCatPages, p + 1)
                                  )
                                }
                                className="cursor-pointer"
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No categories found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
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
                variant="outline"
                onClick={() => {
                  resetForm();
                  setOpenAdd(false);
                }}
                disabled={saving}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddItem}
                disabled={saving}
                className="cursor-pointer"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
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
                variant="outline"
                onClick={() => {
                  resetForm();
                  setEditingItem(null);
                  setOpenEdit(false);
                }}
                disabled={saving}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditItem}
                disabled={saving}
                className="cursor-pointer"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openDelete} onOpenChange={setOpenDelete}>
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
                variant="outline"
                onClick={() => setOpenDelete(false)}
                disabled={deleting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteItem}
                disabled={deleting}
                className="cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openRenameCategory} onOpenChange={setOpenRenameCategory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Category</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="New name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpenRenameCategory(false);
                  setSelectedCategory(null);
                  setCategoryName("");
                }}
                disabled={saving}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRenameCategory}
                disabled={saving}
                className="cursor-pointer"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openDeleteCategory} onOpenChange={setOpenDeleteCategory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this category?
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpenDeleteCategory(false);
                  setSelectedCategory(null);
                }}
                disabled={deleting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCategory}
                disabled={deleting}
                className="cursor-pointer"
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
