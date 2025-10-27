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
import type { Sale } from "@/lib/types/sale";

export default function SalesTable() {
  const user = useAuthStore((s) => s.user);
  const {
    sales,
    isLoading,
    refetch,
    addSale,
    editSale,
    deleteSale,
    importCSV,
    importExcel,
    exportCSV,
    exportExcel,
    getInsight,
  } = useSales();

  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState<Date | null>(new Date());
  const [adding, setAdding] = useState(false);

  // Edit modal state
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editing, setEditing] = useState(false);

  // Filter controls
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // Import
  const [importing, setImporting] = useState(false);

  // AI Insights
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [lastInsightDate, setLastInsightDate] = useState<Date | null>(null);

  const canMutate = user?.role === "ADMIN" || user?.role === "SUB_ADMIN";
  const canGenerateInsight = useMemo(() => {
    if (!canMutate) return false;
    if (!lastInsightDate) return true;
    const now = new Date();
    const diff = now.getTime() - lastInsightDate.getTime();
    return diff > 6 * 24 * 60 * 60 * 1000; // 7 days
  }, [canMutate, lastInsightDate]);

  // Filter sales by year/month/week
  const filteredSales =
    sales?.filter((s: Sale) => {
      const d = new Date(s.date);
      if (d.getFullYear() !== year) return false;
      if (month && d.getMonth() + 1 !== month) return false;
      return true;
    }) ?? [];

  // Prepare chart data
  const chartData =
    month &&
    Array.from({ length: 4 }, (_, i) => {
      // 4 weeks in month
      const weekSales = filteredSales.filter((s: Sale) => {
        const d = new Date(s.date);
        const week = Math.ceil(d.getDate() / 7);
        return week === i + 1;
      });
      return {
        name: `Week ${i + 1}`,
        sales: weekSales.reduce((sum: number, s: Sale) => sum + s.amount, 0),
      };
    });

  async function handleAddSale(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date) return;
    if (!user?.businessId) return;
    setAdding(true);
    try {
      await addSale.mutateAsync({
        amount: parseFloat(amount),
        description: desc,
        businessId: user.businessId,
        date,
      });
      toast.success("Sale added!");
      setAmount("");
      setDesc("");
      setDate(new Date());
      refetch();
    } catch {
      toast.error("Failed to add sale");
    } finally {
      setAdding(false);
    }
  }

  async function handleEditSale(e: React.FormEvent) {
    e.preventDefault();
    if (!editId || !editAmount || !editDate) return;
    setEditing(true);
    try {
      await editSale.mutateAsync({
        id: editId,
        amount: parseFloat(editAmount),
        description: editDesc,
        date: editDate,
      });
      toast.success("Sale updated!");
      setEditId(null);
      setEditAmount("");
      setEditDesc("");
      setEditDate(null);
      refetch();
    } catch {
      toast.error("Failed to update sale");
    } finally {
      setEditing(false);
    }
  }

  async function handleDeleteSale(id: string) {
    try {
      await deleteSale.mutateAsync(id);
      toast.success("Sale deleted!");
      refetch();
    } catch {
      toast.error("Failed to delete sale");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      if (file.name.endsWith(".csv")) {
        await importCSV.mutateAsync({
          file,
          businessId: user?.businessId ?? "",
        });
      } else if (file.name.endsWith(".xlsx")) {
        await importExcel.mutateAsync({
          file,
          businessId: user?.businessId ?? "",
        });
      } else {
        throw new Error("Unsupported file type");
      }
      toast.success("Sales imported!");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to import sales");
    } finally {
      setImporting(false);
    }
  }

  function handleExportCSV() {
    exportCSV(filteredSales);
  }

  async function handleExportExcel() {
    await exportExcel(filteredSales);
  }

  async function handleAIInsights() {
    setInsightLoading(true);
    try {
      const res = await getInsight.mutateAsync({
        year,
        month: month,
        businessId: user?.businessId ?? "",
      });
      setInsight(res.insight || "No insight available.");
      if (!res.cached) setLastInsightDate(new Date());
      else if (res.cached && res.insight) setLastInsightDate(new Date());
    } catch {
      toast.error("Failed to get AI insights");
    } finally {
      setInsightLoading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 items-center">
        <ByteDatePicker
          value={new Date(year, month - 1)}
          onChange={(date) => {
            if (date) {
              setYear(date.getFullYear());
              setMonth(date.getMonth() + 1);
            }
          }}
          formatString="yyyy-mm"
          includeDays={false}
          hideInput
        >
          {({ open, formattedValue }) => (
            <input
              type="text"
              readOnly
              value={
                formattedValue || `${year}-${String(month).padStart(2, "0")}`
              }
              onClick={open}
              className="block w-full max-w-xs rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer font-medium"
            />
          )}
        </ByteDatePicker>
        <button
          type="button"
          className={`bg-blue-600 text-white px-3 py-1 rounded ${
            !canGenerateInsight ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleAIInsights}
          disabled={!canGenerateInsight || insightLoading}
        >
          {insightLoading ? "Generating..." : "AI Insights"}
        </button>
        {canMutate && (
          <>
            <label className="bg-blue-50 border border-blue-600 px-3 py-1 rounded cursor-pointer">
              {importing ? "Importing..." : "Import CSV/Excel"}
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              type="button"
              className="bg-blue-50 border border-blue-600 px-3 py-1 rounded cursor-pointer"
              onClick={handleExportCSV}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="bg-blue-50 border border-blue-600 px-3 py-1 rounded cursor-pointer"
              onClick={handleExportExcel}
            >
              Export Excel
            </button>
          </>
        )}
      </div>
      {/* Add sale */}
      {canMutate && (
        <form onSubmit={handleAddSale} className="flex gap-2 mb-6 flex-wrap">
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <ByteDatePicker
            value={date}
            onChange={setDate}
            includeDays
            formatString="yyyy-mm-dd"
            required
            hideInput
          >
            {({ open, formattedValue }) => (
              <input
                type="text"
                readOnly
                value={formattedValue || ""}
                onClick={open}
                placeholder="Select Date"
                className="border rounded px-3 py-2 bg-white dark:bg-blue-900/40 cursor-pointer"
              />
            )}
          </ByteDatePicker>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={adding}
          >
            {adding ? "Adding..." : "Add Sale"}
          </button>
        </form>
      )}
      {/* Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sales" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Table */}
      {isLoading ? (
        <div>Loading sales...</div>
      ) : filteredSales.length ? (
        <table className="w-full border rounded">
          <thead>
            <tr className="bg-blue-50 dark:bg-blue-900/40">
              <th className="p-2 text-left">Amount</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Date</th>
              {canMutate && <th className="p-2 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale: Sale) => (
              <tr key={sale.id} className="border-t">
                <td className="p-2">₦{sale.amount.toLocaleString()}</td>
                <td className="p-2">{sale.description || "-"}</td>
                <td className="p-2">
                  {new Date(sale.date).toLocaleDateString()}
                </td>
                {canMutate && (
                  <td className="p-2 flex gap-2">
                    <button
                      className="text-blue-600 text-xs"
                      onClick={() => {
                        setEditId(sale.id);
                        setEditAmount(sale.amount.toString());
                        setEditDesc(sale.description ?? "");
                        setEditDate(new Date(sale.date));
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 text-xs"
                      onClick={() => handleDeleteSale(sale.id)}
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
          {canMutate
            ? "Sales is empty, start adding."
            : "Sales is empty, please contact admin."}
        </div>
      )}
      {/* Edit Modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-blue-900/40 rounded-lg p-6 shadow-lg w-full max-w-sm">
            <h3 className="font-semibold mb-4">Edit Sale</h3>
            <form onSubmit={handleEditSale} className="space-y-4">
              <input
                type="number"
                placeholder="Amount"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              />
              <ByteDatePicker
                value={editDate}
                onChange={setEditDate}
                includeDays
                formatString="yyyy-mm-dd"
                required
                hideInput
              >
                {({ open, formattedValue }) => (
                  <input
                    type="text"
                    readOnly
                    value={formattedValue || ""}
                    onClick={open}
                    placeholder="Select Date"
                    className="border rounded px-3 py-2 bg-white dark:bg-blue-900/40 w-full cursor-pointer"
                  />
                )}
              </ByteDatePicker>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700"
                  onClick={() => setEditId(null)}
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
      {/* AI Insight display */}
      {insight && canMutate && (
        <div className="mt-6 p-4 border rounded bg-blue-50 dark:bg-blue-900/40 text-sm">
          <strong>Suite 33 AI Insight:</strong>
          <div className="mt-2 whitespace-pre-line">{insight}</div>
        </div>
      )}
    </div>
  );
}
