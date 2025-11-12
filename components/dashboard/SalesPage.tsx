"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { ExportableSale, useSales } from "@/lib/hooks/useSales";
import { useInsightStore } from "@/lib/stores/insightStore";
import ByteDatePicker from "byte-datepicker";
import "byte-datepicker/styles.css";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Plus,
  FileDown,
  FileUp,
  Lightbulb,
  Trash2,
  Edit,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltipComponent,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import type { Sale } from "@/lib/types/sale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

type ChartPoint = { name: string; amount: number; count: number };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const p: ChartPoint = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow">
      <div className="font-medium">{label}</div>
      <div>Amount: ₦{p.amount.toLocaleString()}</div>
      <div>Sales: {p.count}</div>
    </div>
  );
}

export default function SalesPage() {
  const user = useAuthStore((s) => s.user);
  const { insight, setInsight, clearInsight } = useInsightStore();
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
  } = useSales(
    user ? { businessId: user.businessId ?? undefined, id: user.id } : undefined
  );

  const canMutate = user?.role === "ADMIN" || user?.role === "SUB_ADMIN";
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [date, setDate] = useState<Date | null>(new Date());
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [openAddDate, setOpenAddDate] = useState(false);
  const [openEditDate, setOpenEditDate] = useState(false);
  const [form, setForm] = useState({ desc: "", amount: "", date: new Date() });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const insightRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");

  const resetForm = () => setForm({ desc: "", amount: "", date: new Date() });

  useEffect(() => {
    setPage(1);
  }, [viewMode, date, search]);

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + "…" : text;

  const filteredSales = useMemo(() => {
    if (!sales || !date) return [];
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const normalizedSearch = search.trim().toLowerCase();
    return sales
      .filter((s: Sale) => {
        const sd = new Date(s.date);
        const byPeriod =
          viewMode === "yearly"
            ? sd.getFullYear() === year
            : sd.getFullYear() === year && sd.getMonth() + 1 === month;
        const bySearch =
          !normalizedSearch ||
          s.description?.toLowerCase().includes(normalizedSearch);
        return byPeriod && bySearch;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sales, date, viewMode, search]);

  const totalAmount = filteredSales.reduce((sum, s) => sum + s.amount, 0);
  const totalSales = filteredSales.length;
  const totalPages = Math.ceil(totalSales / perPage);
  const paginatedSales = filteredSales.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const chartData: ChartPoint[] =
    viewMode === "yearly"
      ? Array.from({ length: 12 }, (_, i) => {
          const list = filteredSales.filter(
            (s) => new Date(s.date).getMonth() === i
          );
          return {
            name: new Date(0, i).toLocaleString("default", { month: "short" }),
            amount: list.reduce((sum, s) => sum + s.amount, 0),
            count: list.length,
          };
        })
      : Array.from({ length: 4 }, (_, i) => {
          const list = filteredSales.filter((s) => {
            const day = new Date(s.date).getDate();
            return Math.ceil(day / 7) === i + 1;
          });
          return {
            name: `Week ${i + 1}`,
            amount: list.reduce((sum, s) => sum + s.amount, 0),
            count: list.length,
          };
        });

  const periodLabel =
    viewMode === "yearly"
      ? `${date?.getFullYear()} Sales`
      : `${date?.toLocaleString("default", {
          month: "long",
        })} ${date?.getFullYear()} Sales`;

  function formatSalesExport(sales: Sale[]): ExportableSale[] {
    return sales.map((s) => ({
      Description: s.description,
      Amount: `₦${s.amount.toLocaleString()}`,
      Date: new Date(s.date).toLocaleDateString("en-GB"),
    }));
  }

  async function handleInsight() {
    if (!user?.businessId) return;
    setInsightLoading(true);
    try {
      const res = await getInsight.mutateAsync({
        year: date?.getFullYear() ?? new Date().getFullYear(),
        month: viewMode === "monthly" ? (date?.getMonth() ?? 0) + 1 : undefined,
        businessId: user?.businessId ?? "",
        userId: user?.id ?? "",
      });
      const refined = String(res.insight || "")
        .replace(/\*\*/g, "")
        .trim();
      setInsight(refined);
      toast.success("Insight generated successfully");
      setTimeout(
        () => insightRef.current?.scrollIntoView({ block: "start" }),
        150
      );
    } catch {
      toast.error("Failed to generate insights");
    } finally {
      setInsightLoading(false);
    }
  }

  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!user?.businessId) return;
    try {
      if (f.name.toLowerCase().endsWith(".csv")) {
        await importCSV.mutateAsync({
          file: f,
          businessId: user?.businessId ?? "",
          userId: user?.id ?? "",
        });
      } else {
        await importExcel.mutateAsync({
          file: f,
          businessId: user?.businessId,
          userId: user.id,
        });
      }
      toast.success("Sales imported successfully");
    } catch {
      toast.error("Failed to import sales");
    } finally {
      e.currentTarget.value = "";
    }
  }

  async function handleAdd() {
    if (!form.amount) return toast.error("Enter sale amount");
    if (!form.desc) return toast.error("Enter sale description");
    setSaving(true);
    try {
      await addSale.mutateAsync({
        amount: parseFloat(form.amount),
        description: form.desc,
        businessId: user?.businessId ?? "",
        userId: user?.id ?? "",
        date: form.date,
      });
      toast.success("Sale added");
      setOpenAdd(false);
      resetForm();
    } catch {
      toast.error("Failed to add sale");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!editingSale) return;
    if (!form.amount) return toast.error("Enter sale amount");
    if (!form.desc) return toast.error("Enter sale description");
    if (
      editingSale.description === form.desc &&
      editingSale.amount === parseFloat(form.amount) &&
      new Date(editingSale.date).getTime() === new Date(form.date).getTime()
    ) {
      setOpenEdit(false);
      setEditingSale(null);
      resetForm();
      return;
    }
    setSaving(true);
    try {
      await editSale.mutateAsync({
        id: editingSale.id,
        amount: parseFloat(form.amount),
        description: form.desc,
        date: form.date,
        businessId: user?.businessId ?? "",
        userId: user?.id ?? "",
      });
      toast.success("Sale updated");
      setOpenEdit(false);
      setEditingSale(null);
      resetForm();
    } catch {
      toast.error("Failed to update sale");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingSale) return;
    setDeleting(true);
    try {
      await deleteSale.mutateAsync({
        id: deletingSale.id,
        businessId: user?.businessId ?? "",
        userId: user?.id ?? "",
      });
      toast.success("Sale deleted");
    } catch {
      toast.error("Failed to delete sale");
    } finally {
      setDeleting(false);
      setDeletingSale(null);
      setOpenDelete(false);
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Sales</h2>
          {canMutate && (
            <Button
              onClick={() => {
                setEditingSale(null);
                resetForm();
                setOpenAdd(true);
              }}
              className="gap-2 cursor-pointer"
            >
              <Plus size={16} /> Add Sale
            </Button>
          )}
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList className="w-fit">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>

          <div className="my-4 flex flex-col gap-4">
            <div className="flex w-full gap-2">
              <ByteDatePicker
                value={date}
                onChange={(d) => setDate(d)}
                hideInput
                formatString={viewMode === "yearly" ? "yyyy" : "month yyyy"}
                yearOnly={viewMode === "yearly"}
              >
                {({ open, formattedValue }) => (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={open}
                    className="w-48 justify-start font-medium cursor-pointer gap-2"
                  >
                    <CalendarIcon size={16} />
                    {formattedValue ||
                      (viewMode === "yearly" ? "Select Year" : "Select Month")}
                  </Button>
                )}
              </ByteDatePicker>

              <Input
                placeholder="Search by description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {canMutate && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
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
                    exportCSV(formatSalesExport(filteredSales), periodLabel);
                    toast.success("CSV exported successfully");
                  }}
                >
                  <FileDown size={16} /> Export CSV
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 cursor-pointer w-full"
                  onClick={() => {
                    exportExcel(formatSalesExport(filteredSales), periodLabel);
                    toast.success("Excel exported successfully");
                  }}
                >
                  <FileDown size={16} /> Export Excel
                </Button>
                <Button
                  className="gap-2 bg-blue-600 text-white hover:bg-blue-700 cursor-pointer w-full"
                  onClick={async () => {
                    clearInsight();
                    await handleInsight();
                  }}
                  disabled={insightLoading}
                >
                  <Lightbulb size={16} />
                  {insightLoading ? "Analyzing..." : "AI Insight"}
                </Button>
              </div>
            )}
          </div>

          <TabsContent value={viewMode}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold">
                  {periodLabel}
                </CardTitle>
                <div className="text-sm font-semibold">
                  Total: ₦{totalAmount.toLocaleString()} ({totalSales}{" "}
                  {totalSales === 1 ? "sale" : "sales"})
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="w-full h-[420px] rounded-lg" />
                ) : (
                  <ResponsiveContainer width="100%" height={420}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltipComponent content={<ChartTooltip />} />
                      <Bar
                        dataKey="amount"
                        fill="#2563eb"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader className="py-4">
                <CardTitle className="text-base font-semibold">
                  Sales Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : totalSales > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>S/N</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          {canMutate && <TableHead>Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSales.map((s, i) => (
                          <TableRow key={s.id}>
                            <TableCell>
                              {(page - 1) * perPage + i + 1}
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-block max-w-[220px] truncate">
                                    {truncate(s.description || "-", 25)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {s.description || "-"}
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>₦{s.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              {new Date(s.date).toLocaleDateString("en-GB")}
                            </TableCell>
                            {canMutate && (
                              <TableCell className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 cursor-pointer"
                                  onClick={() => {
                                    setEditingSale(s);
                                    setForm({
                                      desc: s.description,
                                      amount: s.amount.toString(),
                                      date: new Date(s.date),
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
                                  onClick={() => {
                                    setDeletingSale(s);
                                    setOpenDelete(true);
                                  }}
                                >
                                  <Trash2 size={14} /> Delete
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

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
                  <p className="text-sm text-muted-foreground">
                    No sales found.
                  </p>
                )}
              </CardContent>
            </Card>

            {insight && (
              <Card
                ref={insightRef}
                className="mt-6 border-blue-200 dark:border-blue-800"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-blue-700 dark:text-blue-300">
                    Suite 33 AI Insight
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm whitespace-pre-line leading-relaxed">
                  {insight}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Sale</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Description"
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <Popover open={openAddDate} onOpenChange={setOpenAddDate}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start gap-2 cursor-pointer w-full"
                >
                  <CalendarIcon size={16} />
                  {form.date ? format(form.date, "dd-MM-yyyy") : "Select Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                sideOffset={4}
                className="p-0 w-auto mx-auto"
              >
                <Calendar
                  mode="single"
                  selected={form.date}
                  onSelect={(d) => {
                    if (d) {
                      setForm({ ...form, date: d });
                      setOpenAddDate(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
                onClick={handleAdd}
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
              <DialogTitle>Edit Sale</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Description"
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <Popover open={openEditDate} onOpenChange={setOpenEditDate}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start gap-2 cursor-pointer w-full"
                >
                  <CalendarIcon size={16} />
                  {form.date ? format(form.date, "dd-MM-yyyy") : "Select Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                sideOffset={4}
                className="p-0 w-auto mx-auto"
              >
                <Calendar
                  mode="single"
                  selected={form.date}
                  onSelect={(d) => {
                    if (d) {
                      setForm({ ...form, date: d });
                      setOpenEditDate(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setEditingSale(null);
                  setOpenEdit(false);
                }}
                disabled={saving}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
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
              <DialogTitle>Delete Sale</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this sale record?</p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenDelete(false)}
                className="cursor-pointer"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
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
