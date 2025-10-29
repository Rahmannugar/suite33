"use client";

import { useAuthStore } from "@/lib/stores/authStore";
import { useSales } from "@/lib/hooks/useSales";
import { useState, useMemo } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
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
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editing, setEditing] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const canMutate = user?.role === "ADMIN" || user?.role === "SUB_ADMIN";

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const filteredSales =
    sales?.filter((s) => {
      const d = new Date(s.date);
      if (viewMode === "monthly") {
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      }
      return d.getFullYear() === year;
    }) ?? [];

  const totalSales = filteredSales.reduce((sum, s) => sum + s.amount, 0);
  const paginatedSales = filteredSales.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const chartData =
    viewMode === "monthly"
      ? Array.from({ length: 4 }, (_, i) => {
          const weekSales = filteredSales.filter((s) => {
            const d = new Date(s.date);
            const week = Math.ceil(d.getDate() / 7);
            return week === i + 1;
          });
          return {
            name: `Week ${i + 1}`,
            sales: weekSales.reduce((sum, s) => sum + s.amount, 0),
          };
        })
      : Array.from({ length: 12 }, (_, i) => {
          const monthSales = filteredSales.filter(
            (s) => new Date(s.date).getMonth() === i
          );
          return {
            name: new Date(0, i).toLocaleString("default", { month: "short" }),
            sales: monthSales.reduce((sum, s) => sum + s.amount, 0),
          };
        });

  async function handleAIInsights() {
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

  function handleExport(type: "csv" | "excel") {
    const filtered = filteredSales.map((s, i) => ({
      S_N: i + 1,
      Amount: `₦${s.amount.toLocaleString()}`,
      Description: s.description || "-",
      Date: new Date(s.date).toLocaleDateString(),
    }));
    const label =
      viewMode === "monthly"
        ? `${date.toLocaleString("default", { month: "long" })} ${year} sales`
        : `${year} sales`;
    type === "csv" ? exportCSV(filtered, label) : exportExcel(filtered, label);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Sales Overview</h1>
        <div className="flex items-center gap-3">
          <Button
            variant={viewMode === "monthly" ? "default" : "outline"}
            onClick={() => setViewMode("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={viewMode === "yearly" ? "default" : "outline"}
            onClick={() => setViewMode("yearly")}
          >
            Yearly
          </Button>
          <ByteDatePicker
            value={date}
            onChange={(val) => val && setDate(val)}
            includeDays={false}
            formatString={viewMode === "monthly" ? "mm yyyy" : "yyyy"}
          >
            {({ open, formattedValue }) => (
              <Button
                onClick={open}
                variant="outline"
                className="cursor-pointer font-medium"
              >
                {formattedValue}
              </Button>
            )}
          </ByteDatePicker>
        </div>
      </div>

      {/* Total Summary */}
      <div className="text-xl font-semibold">
        Total: ₦{totalSales.toLocaleString()}
      </div>

      {/* Chart */}
      <Card className="hover:shadow-lg transition">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-700 dark:text-blue-300">
            {viewMode === "monthly"
              ? "Weekly Sales Breakdown"
              : "Yearly Sales Trend"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
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
        <CardHeader className="pb-2">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSales.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell>{(page - 1) * perPage + i + 1}</TableCell>
                      <TableCell>₦{s.amount.toLocaleString()}</TableCell>
                      <TableCell>{s.description || "-"}</TableCell>
                      <TableCell>
                        {new Date(s.date).toLocaleDateString()}
                      </TableCell>
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

      {/* AI Insight Section */}
      <AnimatePresence mode="wait">
        {insightLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Card className="p-5 space-y-3">
              <CardHeader>
                <CardTitle className="font-semibold text-lg text-[--foreground]">
                  Suite 33 AI Insight
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </motion.div>
        ) : insight ? (
          <motion.div
            key="insight-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Card className="p-5 border border-blue-200 dark:border-blue-800 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="font-semibold text-lg text-blue-700 dark:text-blue-300">
                  Suite 33 AI Insight
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-4 leading-relaxed">
                <InsightText text={insight} />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="generate-button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Button
              onClick={handleAIInsights}
              className="bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
            >
              Generate AI Insight
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** AI insight parser */
function InsightText({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("**Summary:**"))
          return (
            <h3 key={i} className="font-semibold text-base mt-2 mb-1">
              Summary
            </h3>
          );
        if (line.startsWith("**Insights:**"))
          return (
            <h3 key={i} className="font-semibold text-base mt-4 mb-1">
              Insights
            </h3>
          );
        if (line.startsWith("**Recommendations:**"))
          return (
            <h3 key={i} className="font-semibold text-base mt-4 mb-1">
              Recommendations
            </h3>
          );
        if (line.startsWith("-"))
          return (
            <li key={i} className="ml-5 list-disc text-[--muted-foreground]">
              {line.replace(/^-/, "").trim()}
            </li>
          );
        if (/^\d\./.test(line))
          return (
            <li key={i} className="ml-5 list-decimal text-[--muted-foreground]">
              {line.replace(/^\d\./, "").trim()}
            </li>
          );
        return (
          <p key={i} className="text-[--foreground]/90">
            {line}
          </p>
        );
      })}
    </div>
  );
}
