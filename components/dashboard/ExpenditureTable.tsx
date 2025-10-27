"use client";

import { useAuthStore } from "@/lib/stores/authStore";
import { useExpenditures } from "@/lib/hooks/useExpenditures";
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
import type { Expenditure } from "@/lib/types/expenditure";

export default function ExpenditureTable() {
  const user = useAuthStore((s) => s.user);
  const {
    expenditures,
    isLoading,
    refetch,
    addExpenditure,
    editExpenditure,
    deleteExpenditure,
    importCSV,
    importExcel,
    exportCSV,
    exportExcel,
    getInsight,
  } = useExpenditures();

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
  const [period, setPeriod] = useState<"month" | "week">("month");
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

  // Filter expenditures by year/month/week
  const filteredExpenditures =
    expenditures?.filter((e: Expenditure) => {
      const d = new Date(e.date);
      if (d.getFullYear() !== year) return false;
      if (period === "month" && d.getMonth() + 1 !== month) return false;
      return true;
    }) ?? [];

  // Prepare chart data
  const chartData =
    period === "month"
      ? Array.from({ length: 4 }, (_, i) => {
          // 4 weeks in month
          const weekExps = filteredExpenditures.filter((e: Expenditure) => {
            const d = new Date(e.date);
            const week = Math.ceil(d.getDate() / 7);
            return week === i + 1;
          });
          return {
            name: `Week ${i + 1}`,
            exp: weekExps.reduce(
              (sum: number, e: Expenditure) => sum + e.amount,
              0
            ),
          };
        })
      : Array.from({ length: 12 }, (_, i) => {
          // 12 months in year
          const monthExps = filteredExpenditures.filter((e: Expenditure) => {
            const d = new Date(e.date);
            return d.getMonth() === i;
          });
          return {
            name: new Date(2000, i).toLocaleString("default", {
              month: "short",
            }),
            exp: monthExps.reduce(
              (sum: number, e: Expenditure) => sum + e.amount,
              0
            ),
          };
        });

  async function handleAddExpenditure(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date) return;
    if (!user?.businessId) return;
    setAdding(true);
    try {
      await addExpenditure.mutateAsync({
        amount: parseFloat(amount),
        description: desc,
        businessId: user.businessId as string,
        date,
      });
      toast.success("Expenditure added!");
      setAmount("");
      setDesc("");
      setDate(new Date());
      refetch();
    } catch {
      toast.error("Failed to add expenditure");
    } finally {
      setAdding(false);
    }
  }

  async function handleEditExpenditure(e: React.FormEvent) {
    e.preventDefault();
    if (!editId || !editAmount || !editDate) return;
    setEditing(true);
    try {
      await editExpenditure.mutateAsync({
        id: editId,
        amount: parseFloat(editAmount),
        description: editDesc,
        date: editDate,
      });
      toast.success("Expenditure updated!");
      setEditId(null);
      setEditAmount("");
      setEditDesc("");
      setEditDate(null);
      refetch();
    } catch {
      toast.error("Failed to update expenditure");
    } finally {
      setEditing(false);
    }
  }

  async function handleDeleteExpenditure(id: string) {
    try {
      await deleteExpenditure.mutateAsync(id);
      toast.success("Expenditure deleted!");
      refetch();
    } catch {
      toast.error("Failed to delete expenditure");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user?.businessId) return;
    setImporting(true);
    try {
      if (file.name.endsWith(".csv")) {
        await importCSV.mutateAsync({ file, businessId: user.businessId });
      } else if (file.name.endsWith(".xlsx")) {
        await importExcel.mutateAsync({ file, businessId: user.businessId });
      } else {
        throw new Error("Unsupported file type");
      }
      toast.success("Expenditures imported!");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to import expenditures");
    } finally {
      setImporting(false);
    }
  }

  function handleExportCSV() {
    exportCSV(filteredExpenditures);
  }

  async function handleExportExcel() {
    await exportExcel(filteredExpenditures);
  }

  async function handleAIInsights() {
    setInsightLoading(true);
    try {
      if (!user?.businessId) throw new Error("Missing businessId");
      const { data } = await getInsight.mutateAsync({
        year,
        month: period === "month" ? month : undefined,
        businessId: user.businessId as string,
      });
      setInsight(data.insight);
      setLastInsightDate(new Date());
    } catch (err: any) {
      toast.error(err?.message || "Failed to get insight");
    } finally {
      setInsightLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Expenditures</h2>
      {/* Filter controls */}
      <div className="flex gap-2 mb-4 items-center">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {Array.from(
            new Set(
              (expenditures ?? []).map((e: Expenditure) =>
                new Date(e.date).getFullYear()
              )
            )
          )
            .sort((a, b) => Number(b) - Number(a))
            .map((y) => (
              <option key={String(y)} value={String(y)}>
                {String(y)}
              </option>
            ))}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2000, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as "month" | "week")}
          className="border rounded px-2 py-1"
        >
          <option value="month">Monthly</option>
          <option value="week">Weekly</option>
        </select>
      </div>
      {/* Add expenditure */}
      {canMutate && (
        <form
          onSubmit={handleAddExpenditure}
          className="flex gap-2 mb-6 flex-wrap"
        >
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
            {adding ? "Adding..." : "Add Expenditure"}
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
            <Bar dataKey="exp" fill="#eab308" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Table */}
      {isLoading ? (
        <div>Loading expenditures...</div>
      ) : filteredExpenditures.length ? (
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
            {filteredExpenditures.map((exp: Expenditure) => (
              <tr key={exp.id} className="border-t">
                <td className="p-2">₦{exp.amount.toLocaleString()}</td>
                <td className="p-2">{exp.description || "-"}</td>
                <td className="p-2">
                  {new Date(exp.date).toLocaleDateString()}
                </td>
                {canMutate && (
                  <td className="p-2 flex gap-2">
                    <button
                      className="text-blue-600 text-xs"
                      onClick={() => {
                        setEditId(exp.id);
                        setEditAmount(exp.amount.toString());
                        setEditDesc(exp.description ?? "");
                        setEditDate(new Date(exp.date));
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 text-xs"
                      onClick={() => handleDeleteExpenditure(exp.id)}
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
            ? "Expenditures is empty, start adding."
            : "Expenditures is empty, please contact admin."}
        </div>
      )}
      {/* Edit Modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-blue-900/40 rounded-lg p-6 shadow-lg w-full max-w-sm">
            <h3 className="font-semibold mb-4">Edit Expenditure</h3>
            <form onSubmit={handleEditExpenditure} className="space-y-4">
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
