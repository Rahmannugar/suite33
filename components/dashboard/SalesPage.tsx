"use client";

import { useState, useMemo, useRef } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useSales } from "@/lib/hooks/useSales";
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
  Tooltip,
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
  } = useSales();

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
  const [insightLoading, setInsightLoading] = useState(false);

  const insightRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredSales = useMemo(() => {
    if (!sales || !date) return [];
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    return sales
      .filter((s) => {
        const sd = new Date(s.date);
        return viewMode === "yearly"
          ? sd.getFullYear() === year
          : sd.getFullYear() === year && sd.getMonth() + 1 === month;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sales, date, viewMode]);

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

  const handleInsight = async () => {
    if (!user?.businessId) return;
    setInsightLoading(true);
    try {
      const res = await getInsight.mutateAsync({
        year: date?.getFullYear() ?? new Date().getFullYear(),
        month: viewMode === "monthly" ? (date?.getMonth() ?? 0) + 1 : undefined,
        businessId: user.businessId,
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
  };

  const handleImportClick = () => fileInputRef.current?.click();
  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.name.toLowerCase().endsWith(".csv")
      ? importCSV.mutate({ file: f, businessId: user?.businessId ?? "" })
      : importExcel.mutate({ file: f, businessId: user?.businessId ?? "" });
    e.currentTarget.value = "";
  };

  const exportLabel =
    viewMode === "yearly"
      ? `${date?.getFullYear()} Sales`
      : `${date?.toLocaleString("default", {
          month: "long",
        })} ${date?.getFullYear()} Sales`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Sales</h2>
        {canMutate && (
          <Button
            onClick={() => setOpenAdd(true)}
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

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full md:w-auto">
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
                  className="w-full md:w-48 justify-start font-medium cursor-pointer gap-2"
                >
                  <CalendarIcon size={16} />
                  {formattedValue ||
                    (viewMode === "yearly" ? "Select Year" : "Select Month")}
                </Button>
              )}
            </ByteDatePicker>
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
                  <FileUp size={16} />
                  Import CSV/Excel
                </Button>

                <Button
                  variant="outline"
                  className="whitespace-nowrap w-full md:w-auto gap-2 cursor-pointer"
                  onClick={() =>
                    exportCSV(
                      filteredSales.map((s) => ({
                        Description: s.description || "-",
                        Amount: `₦${s.amount.toLocaleString()}`,
                        Date: new Date(s.date).toLocaleDateString("en-GB"),
                      })),
                      exportLabel
                    )
                  }
                >
                  <FileDown size={16} /> Export CSV
                </Button>

                <Button
                  variant="outline"
                  className="whitespace-nowrap w-full md:w-auto gap-2 cursor-pointer"
                  onClick={() =>
                    exportExcel(
                      filteredSales.map((s) => ({
                        Description: s.description || "-",
                        Amount: `₦${s.amount.toLocaleString()}`,
                        Date: new Date(s.date).toLocaleDateString("en-GB"),
                      })),
                      exportLabel
                    )
                  }
                >
                  <FileDown size={16} /> Export Excel
                </Button>
              </>
            )}

            <Button
              className="w-full md:w-auto gap-2 bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
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
        </div>

        {/* Chart and Table */}
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
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="amount"
                      fill="#eab308"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
