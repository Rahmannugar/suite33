"use client";

import { useAuthStore } from "@/lib/stores/authStore";
import { useSales } from "@/lib/hooks/useSales";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ByteDatePicker from "byte-datepicker";
import "byte-datepicker/styles.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sale } from "@/lib/types/sale";

export default function SalesPage() {
  const user = useAuthStore((s) => s.user);
  const {
    sales,
    isLoading,
    addSale,
    editSale,
    deleteSale,
    importCSV,
    importExcel,
    exportCSV,
    exportExcel,
    getInsight,
  } = useSales();

  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [date, setDate] = useState<Date>(new Date());
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selected, setSelected] = useState<Sale | null>(null);

  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [saleDate, setSaleDate] = useState<Date | null>(new Date());
  const [saving, setSaving] = useState(false);

  const canMutate = user?.role === "ADMIN" || user?.role === "SUB_ADMIN";
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const filteredSales =
    sales?.filter((s) => {
      const d = new Date(s.date);
      return viewMode === "monthly"
        ? d.getFullYear() === year && d.getMonth() + 1 === month
        : d.getFullYear() === year;
    }) ?? [];

  const totalSales = filteredSales.reduce((sum, s) => sum + s.amount, 0);
  const paginated = filteredSales.slice((page - 1) * perPage, page * perPage);

  const chartData =
    viewMode === "monthly"
      ? Array.from({ length: 4 }, (_, i) => {
          const wk = i + 1;
          const wkSales = filteredSales.filter((s) => {
            const d = new Date(s.date);
            const w = Math.ceil(d.getDate() / 7);
            return w === wk;
          });
          return {
            name: `Week ${wk}`,
            sales: wkSales.reduce((sum, s) => sum + s.amount, 0),
          };
        })
      : Array.from({ length: 12 }, (_, i) => {
          const mSales = filteredSales.filter(
            (s) => new Date(s.date).getMonth() === i
          );
          return {
            name: new Date(0, i).toLocaleString("default", { month: "short" }),
            sales: mSales.reduce((sum, s) => sum + s.amount, 0),
          };
        });

  useEffect(() => {
    setInsight(null);
  }, [viewMode, date]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.businessId || !amount || !saleDate) return;
    setSaving(true);
    try {
      await addSale.mutateAsync({
        amount: parseFloat(amount),
        description: desc,
        businessId: user.businessId,
        date: saleDate,
      });
      toast.success("Sale added");
      setAddOpen(false);
      setAmount("");
      setDesc("");
      setSaleDate(new Date());
    } catch {
      toast.error("Failed to add sale");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected?.id || !amount || !saleDate) return;
    setSaving(true);
    try {
      await editSale.mutateAsync({
        id: selected.id,
        amount: parseFloat(amount),
        description: desc,
        date: saleDate,
      });
      toast.success("Sale updated");
      setEditOpen(false);
      setSelected(null);
    } catch {
      toast.error("Failed to update sale");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected?.id) return;
    try {
      await deleteSale.mutateAsync(selected.id);
      toast.success("Sale deleted");
      setDeleteOpen(false);
      setSelected(null);
    } catch {
      toast.error("Failed to delete sale");
    }
  }

  async function handleInsight() {
    setInsightLoading(true);
    try {
      const res = await getInsight.mutateAsync({
        year,
        month: viewMode === "monthly" ? month : undefined,
        businessId: user?.businessId ?? "",
      });
      setInsight(res.insight || "No insight available.");
    } catch {
      toast.error("Failed to get AI insights");
    } finally {
      setInsightLoading(false);
    }
  }

  function handleExport(kind: "csv" | "excel") {
    const rows = filteredSales.map((s, i) => ({
      "S/N": i + 1,
      Amount: `₦${s.amount.toLocaleString()}`,
      Description: s.description || "-",
      Date: new Date(s.date).toLocaleDateString(),
    }));
    const label =
      viewMode === "monthly"
        ? `${date.toLocaleString("default", { month: "long" })} ${year} sales`
        : `${year} sales`;
    kind === "csv" ? exportCSV(rows, label) : exportExcel(rows, label);
  }

  return (
    <div className="space-y-8">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant={viewMode === "monthly" ? "default" : "outline"}
            onClick={() => {
              setViewMode("monthly");
              setPage(1);
            }}
          >
            Monthly
          </Button>
          <Button
            variant={viewMode === "yearly" ? "default" : "outline"}
            onClick={() => {
              setViewMode("yearly");
              setPage(1);
            }}
          >
            Yearly
          </Button>

          <ByteDatePicker
            value={date}
            onChange={(v) => v && setDate(v)}
            includeDays={false}
          >
            {({ open, formattedValue }) => (
              <Button
                onClick={open}
                variant="outline"
                className="cursor-pointer font-medium min-w-[130px]"
              >
                {formattedValue}
              </Button>
            )}
          </ByteDatePicker>

          {canMutate && (
            <>
              <Button variant="outline" onClick={() => setAddOpen(true)}>
                Add Sale
              </Button>
              <label className="px-3 py-2 border rounded-md cursor-pointer text-sm font-medium bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">
                Import CSV/Excel
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.name.endsWith(".csv")) {
                      importCSV.mutate({
                        file,
                        businessId: user?.businessId ?? "",
                      });
                    } else {
                      importExcel.mutate({
                        file,
                        businessId: user?.businessId ?? "",
                      });
                    }
                    e.currentTarget.value = "";
                  }}
                  className="hidden"
                />
              </label>
              <Button variant="outline" onClick={() => handleExport("csv")}>
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport("excel")}>
                Export Excel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="text-xl font-semibold">
        Total: ₦{totalSales.toLocaleString()}
      </div>

      {/* Chart */}
      <Card className="hover:shadow-lg transition cursor-pointer">
        <CardHeader>
          <CardTitle>
            {viewMode === "monthly"
              ? "Weekly Sales Breakdown"
              : "Yearly Sales Trend"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(val: number) => `₦${val.toLocaleString()}`}
              />
              <Bar dataKey="sales" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-[--muted-foreground] mt-2 text-right">
            {filteredSales.length} sales, ₦{totalSales.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : filteredSales.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S/N</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    {canMutate && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((s, i) => (
                    <TableRow
                      key={s.id}
                      className="hover:bg-blue-50/30 transition"
                    >
                      <TableCell>{(page - 1) * perPage + i + 1}</TableCell>
                      <TableCell>₦{s.amount.toLocaleString()}</TableCell>
                      <TableCell>{s.description || "-"}</TableCell>
                      <TableCell>
                        {new Date(s.date).toLocaleDateString()}
                      </TableCell>
                      {canMutate && (
                        <TableCell className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelected(s);
                              setAmount(s.amount.toString());
                              setDesc(s.description || "");
                              setSaleDate(new Date(s.date));
                              setEditOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelected(s);
                              setDeleteOpen(true);
                            }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {viewMode === "yearly" && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setPage((p) =>
                            Math.min(
                              Math.ceil(filteredSales.length / perPage),
                              p + 1
                            )
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
            <p className="text-sm text-[--muted-foreground]">
              No sales records found.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Insight */}
      {insightLoading ? (
        <Card className="p-5 space-y-3">
          <CardHeader>
            <CardTitle>Suite33 AI Insight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      ) : insight ? (
        <Card className="p-5 border border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-300">
              Suite33 AI Insight
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-line leading-relaxed">
            {insight}
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={handleInsight}
          className="bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
        >
          Generate AI Insight
        </Button>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sale</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              required
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description"
              className="w-full p-2 border rounded"
            />
            <ByteDatePicker
              value={saleDate}
              onChange={setSaleDate}
              includeDays
              formatString="dd-MM-yyyy"
            >
              {({ open, formattedValue }) => (
                <input
                  readOnly
                  onClick={open}
                  value={formattedValue || ""}
                  placeholder="Select Date"
                  className="w-full p-2 border rounded cursor-pointer"
                />
              )}
            </ByteDatePicker>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              required
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description"
              className="w-full p-2 border rounded"
            />
            <ByteDatePicker
              value={saleDate}
              onChange={setSaleDate}
              includeDays
              formatString="dd-MM-yyyy"
            >
              {({ open, formattedValue }) => (
                <input
                  readOnly
                  onClick={open}
                  value={formattedValue || ""}
                  placeholder="Select Date"
                  className="w-full p-2 border rounded cursor-pointer"
                />
              )}
            </ByteDatePicker>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sale</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this sale?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
