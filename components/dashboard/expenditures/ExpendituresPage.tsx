"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useExpenditures } from "@/lib/hooks/expenditures/useExpenditures";
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
import { toast } from "sonner";
import type { Expenditure } from "@/lib/types/expenditure";
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
import { ChartPoint, SummaryMonth } from "@/lib/utils/chart";
import { useExpendituresSummary } from "@/lib/hooks/expenditures/useExpendituresSummary";
import ExpendituresChart from "./ExpendituresChart";

export default function ExpendituresPage() {
  const user = useAuthStore((s) => s.user);
  const { insight, setInsight, clearInsight } = useInsightStore();

  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [date, setDate] = useState<Date | null>(new Date());

  const [page, setPage] = useState(1);
  const perPage = 10;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const currentYear = date ? date.getFullYear() : new Date().getFullYear();
  const currentMonth = date ? date.getMonth() + 1 : new Date().getMonth() + 1;

  const {
    expenditures,
    pagination,
    isLoading,
    addExpenditure,
    editExpenditure,
    deleteExpenditure,
    importCSV,
    importExcel,
    exportCSV,
    exportExcel,
    getInsight,
  } = useExpenditures(
    page,
    perPage,
    viewMode === "yearly" ? currentYear : currentYear,
    viewMode === "monthly" ? currentMonth : undefined,
    debouncedSearch
  );

  const canMutate = user?.role === "ADMIN" || user?.role === "SUB_ADMIN";

  const { data: summary } = useExpendituresSummary(
    currentYear,
    viewMode === "monthly" ? currentMonth : undefined
  );

  useEffect(() => {
    setPage(1);
  }, [viewMode, date]);

  const unpaginated = expenditures || [];
  const filtered = useMemo(() => unpaginated, [unpaginated]);

  const totalPages = pagination ? Math.ceil(pagination.total / perPage) : 1;

  const monthlyRaw =
    viewMode === "monthly" && Array.isArray(summary)
      ? (summary as Expenditure[])
      : [];

  let chartData: ChartPoint[] = [];

  if (viewMode === "yearly" && Array.isArray(summary)) {
    chartData = (summary as SummaryMonth[]).map((m) => ({
      name: new Date(2000, m.month - 1).toLocaleString("default", {
        month: "short",
      }),
      amount: m.total,
      count: m.count,
    }));
  }

  if (viewMode === "monthly" && Array.isArray(summary)) {
    chartData = Array.from({ length: 4 }, (_, i) => {
      const start = new Date(currentYear, currentMonth - 1, i * 7 + 1);
      const end = new Date(currentYear, currentMonth - 1, (i + 1) * 7);
      const weekList = monthlyRaw.filter((e) => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });
      return {
        name: `Week ${i + 1}`,
        amount: weekList.reduce((sum, e) => sum + e.amount, 0),
        count: weekList.length,
      };
    });
  }

  const totalEntries =
    viewMode === "monthly"
      ? monthlyRaw.length
      : (summary ?? []).reduce(
          (sum: number, m: SummaryMonth) => sum + m.count,
          0
        );

  const totalAmount =
    viewMode === "monthly"
      ? monthlyRaw.reduce((sum, e) => sum + e.amount, 0)
      : (summary ?? []).reduce(
          (sum: number, m: SummaryMonth) => sum + m.total,
          0
        );

  const periodLabel =
    viewMode === "yearly"
      ? `${currentYear} Expenditures`
      : `${date?.toLocaleString("default", {
          month: "long",
        })} ${currentYear} Expenditures`;

  const chartKey = `${viewMode}-${currentYear}-${currentMonth}`;

  function truncate(text: string, max: number) {
    return text.length > max ? text.slice(0, max) + "…" : text;
  }

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [editingExpenditure, setEditingExpenditure] =
    useState<Expenditure | null>(null);
  const [deletingExpenditure, setDeletingExpenditure] =
    useState<Expenditure | null>(null);

  const [openAddDate, setOpenAddDate] = useState(false);
  const [openEditDate, setOpenEditDate] = useState(false);

  const [form, setForm] = useState({
    desc: "",
    amount: "",
    date: new Date(),
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const insightRef = useRef<HTMLDivElement | null>(null);

  async function handleInsight() {
    try {
      setInsightLoading(true);
      const payload =
        viewMode === "yearly"
          ? { year: currentYear }
          : { year: currentYear, month: currentMonth };
      const result = await getInsight.mutateAsync(payload);
      setInsight(result);
      toast.success("Expenditures insight generated successfully");
    } catch {
      toast.error("Failed to generate expenditures insight");
    } finally {
      setInsightLoading(false);
      setTimeout(() => {
        insightRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isCSV = file.name.toLowerCase().endsWith(".csv");
    const isExcel = file.name.toLowerCase().endsWith(".xlsx");

    try {
      if (isCSV) await importCSV.mutateAsync({ file });
      else if (isExcel) await importExcel.mutateAsync({ file });
      toast.success("Expenditures imported successfully");
    } catch {
      toast.error("Failed to import expenditures");
    } finally {
      e.currentTarget.value = "";
    }
  }

  const [insightLoading, setInsightLoading] = useState(false);

  async function handleAdd() {
    setSaving(true);
    try {
      await addExpenditure.mutateAsync({
        amount: parseInt(form.amount),
        description: form.desc,
        date: form.date,
      });
      toast.success("Successfully added expenditure record");
      setOpenAdd(false);
      setForm({ desc: "", amount: "", date: new Date() });
    } catch {
      toast.error("Failed to add expenditure");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!editingExpenditure) return;
    setSaving(true);
    try {
      await editExpenditure.mutateAsync({
        id: editingExpenditure.id,
        amount: parseInt(form.amount),
        description: form.desc,
        date: form.date,
      });
      toast.success("Successfully edited expenditure record");
      setOpenEdit(false);
      setEditingExpenditure(null);
      setForm({ desc: "", amount: "", date: new Date() });
    } catch {
      toast.error("Failed to edit expenditure record");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingExpenditure) return;
    setDeleting(true);
    try {
      await deleteExpenditure.mutateAsync(deletingExpenditure.id);
      toast.success("Successfully deleted expenditure record");
    } catch {
      toast.error("Failed to delete expenditure record");
    } finally {
      setDeleting(false);
      setDeletingExpenditure(null);
      setOpenDelete(false);
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Expenditures</h2>
          {canMutate && (
            <Button
              onClick={() => {
                setOpenAdd(true);
                setForm({ desc: "", amount: "", date: new Date() });
              }}
              className="gap-2 cursor-pointer"
            >
              <Plus size={16} /> Add Expenditure
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
                placeholder="Search expenditures…"
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
                  onChange={handleImport}
                />

                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 cursor-pointer w-full"
                >
                  <FileUp size={16} /> Import
                </Button>

                <Button
                  variant="outline"
                  className="gap-2 cursor-pointer w-full"
                  onClick={() => {
                    exportCSV(
                      filtered.map((e) => ({
                        Description: e.description,
                        Amount: e.amount.toString(),
                        Date: new Date(e.date).toLocaleDateString(),
                      })),
                      periodLabel
                    );
                    toast.success("CSV exported successfully");
                  }}
                >
                  <FileDown size={16} /> CSV
                </Button>

                <Button
                  variant="outline"
                  className="gap-2 cursor-pointer w-full"
                  onClick={() => {
                    exportExcel(
                      filtered.map((e) => ({
                        Description: e.description,
                        Amount: e.amount.toString(),
                        Date: new Date(e.date).toLocaleDateString(),
                      })),
                      periodLabel
                    );
                    toast.success("Excel exported successfully");
                  }}
                >
                  <FileDown size={16} /> Excel
                </Button>

                <Button
                  className="gap-2 bg-amber-600 text-white hover:bg-amber-700 cursor-pointer w-full"
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
                  Total: ₦{totalAmount.toLocaleString()} ({totalEntries}{" "}
                  {totalEntries === 1 ? "entry" : "entries"})
                </div>
              </CardHeader>
              <CardContent>
                {!summary ? (
                  <Skeleton className="w-full h-[420px] rounded-lg" />
                ) : (
                  <ExpendituresChart data={chartData} chartKey={chartKey} />
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader className="py-4">
                <CardTitle className="text-base font-semibold">
                  Expenditure Records
                </CardTitle>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : filtered.length > 0 ? (
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
                        {filtered.map((e: Expenditure, i: number) => (
                          <TableRow key={e.id}>
                            <TableCell>
                              {(page - 1) * perPage + i + 1}
                            </TableCell>

                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-block max-w-[240px] truncate">
                                    {truncate(e.description || "-", 25)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {e.description || "-"}
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>

                            <TableCell>₦{e.amount.toLocaleString()}</TableCell>

                            <TableCell>
                              {new Date(e.date).toLocaleDateString("en-GB")}
                            </TableCell>

                            {canMutate && (
                              <TableCell className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  className="gap-1 cursor-pointer"
                                  onClick={() => {
                                    setEditingExpenditure(e);
                                    setForm({
                                      desc: e.description,
                                      amount: e.amount.toString(),
                                      date: new Date(e.date),
                                    });
                                    setOpenEdit(true);
                                  }}
                                >
                                  <Edit size={14} /> Edit
                                </Button>

                                <Button
                                  variant="destructive"
                                  className="gap-1 cursor-pointer"
                                  onClick={() => {
                                    setDeletingExpenditure(e);
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
                    No expenditures found.
                  </p>
                )}
              </CardContent>
            </Card>

            {insight && (
              <Card
                ref={insightRef}
                className="mt-6 border-amber-200 dark:border-amber-800"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-amber-700 dark:text-amber-300">
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
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Expenditure</DialogTitle>
            </DialogHeader>

            <Input
              placeholder="Description"
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
            />

            <Input
              type="text"
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
                  {format(form.date, "dd-MM-yyyy")}
                </Button>
              </PopoverTrigger>

              <PopoverContent
                align="center"
                side="bottom"
                sideOffset={8}
                className="p-0 w-auto left-1/2 transform -translate-x-1/2"
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
                />
              </PopoverContent>
            </Popover>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpenAdd(false);
                  setForm({ desc: "", amount: "", date: new Date() });
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
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit Expenditure</DialogTitle>
            </DialogHeader>

            <Input
              placeholder="Description"
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
            />

            <Input
              type="text"
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
                  {format(form.date, "dd-MM-yyyy")}
                </Button>
              </PopoverTrigger>

              <PopoverContent
                align="center"
                side="bottom"
                sideOffset={8}
                className="p-0 w-auto left-1/2 transform -translate-x-1/2"
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
                />
              </PopoverContent>
            </Popover>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpenEdit(false);
                  setEditingExpenditure(null);
                  setForm({ desc: "", amount: "", date: new Date() });
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
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openDelete} onOpenChange={setOpenDelete}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Expenditure</DialogTitle>
            </DialogHeader>

            <p>Are you sure you want to delete this record?</p>

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
                onClick={handleDelete}
                disabled={deleting}
                className="cursor-pointer"
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
