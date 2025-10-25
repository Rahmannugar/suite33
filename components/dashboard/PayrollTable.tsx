"use client";

import { useAuthStore } from "@/lib/stores/authStore";
import { usePayroll } from "@/lib/hooks/usePayroll";
import { useStaff } from "@/lib/hooks/useStaff";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export function PayrollTable() {
  const user = useAuthStore((s) => s.user);
  const { payroll, isLoading, refetch, markPaid, editSalary } = usePayroll();
  const { staff } = useStaff();

  // Filter controls
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // Edit modal state
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editing, setEditing] = useState(false);

  // Role-based payroll filter
  const filteredPayroll = useMemo(() => {
    if (!payroll) return [];
    if (user?.role === "ADMIN") {
      return payroll.filter((p: any) => {
        const d = new Date(p.period);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
    }
    if (user?.role === "SUB_ADMIN" && user?.departmentId) {
      const deptStaffIds = staff
        ?.filter((s: any) => s.departmentId === user.departmentId)
        .map((s: any) => s.id);
      return payroll.filter(
        (p: any) =>
          deptStaffIds?.includes(p.staffId) &&
          new Date(p.period).getFullYear() === year &&
          new Date(p.period).getMonth() + 1 === month
      );
    }
    if (user?.role === "STAFF") {
      return payroll.filter(
        (p: any) =>
          p.staffId === user.id &&
          new Date(p.period).getFullYear() === year &&
          new Date(p.period).getMonth() + 1 === month
      );
    }
    return [];
  }, [payroll, user, staff, year, month]);

  // Total payroll for the month
  const totalPayroll = filteredPayroll.reduce((sum, p) => sum + p.amount, 0);

  const deptName =
    user?.role === "SUB_ADMIN" && user?.departmentName
      ? user.departmentName
      : null;

  async function handleMarkPaid(id: string) {
    try {
      await markPaid.mutateAsync(id);
      toast.success("Marked as paid!");
      refetch();
    } catch {
      toast.error("Failed to mark as paid");
    }
  }

  async function handleEditSalary(e: React.FormEvent) {
    e.preventDefault();
    if (!editId || !editAmount) return;
    setEditing(true);
    try {
      await editSalary.mutateAsync({
        id: editId,
        amount: parseFloat(editAmount),
      });
      toast.success("Salary updated!");
      setEditId(null);
      setEditAmount("");
      refetch();
    } catch {
      toast.error("Failed to update salary");
    } finally {
      setEditing(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Payroll</h2>
      {deptName && (
        <div className="mb-2 text-base font-semibold text-blue-700">
          Department: {deptName}
        </div>
      )}
      {/* Filter controls */}
      <div className="flex gap-2 mb-4 items-center">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {Array.from(
            new Set(payroll?.map((p: any) => new Date(p.period).getFullYear()))
          )
            .sort((a, b) => b - a)
            .map((y) => (
              <option key={y} value={y}>
                {y}
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
      </div>
      {/* Table */}
      {isLoading ? (
        <div>Loading payroll...</div>
      ) : filteredPayroll.length ? (
        <table className="w-full border rounded">
          <thead>
            <tr className="bg-blue-50 dark:bg-blue-900/40">
              <th className="p-2 text-left">Staff</th>
              <th className="p-2 text-left">Department</th>
              <th className="p-2 text-left">Amount</th>
              <th className="p-2 text-left">Period</th>
              <th className="p-2 text-left">Status</th>
              {user?.role === "ADMIN" && (
                <th className="p-2 text-left">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredPayroll.map((p: any) => {
              const staffMember = staff?.find((s: any) => s.id === p.staffId);
              return (
                <tr key={p.id} className="border-t">
                  <td className="p-2">
                    {staffMember?.user?.fullName ||
                      staffMember?.user?.email ||
                      "-"}
                  </td>
                  <td className="p-2">
                    {staffMember?.department?.name || "No department"}
                  </td>
                  <td className="p-2">₦{p.amount.toLocaleString()}</td>
                  <td className="p-2">
                    {new Date(p.period).toLocaleDateString()}
                  </td>
                  <td className="p-2">{p.paid ? "Paid" : "Pending"}</td>
                  {user?.role === "ADMIN" && (
                    <td className="p-2 flex gap-2">
                      <button
                        className="text-blue-600 text-xs"
                        onClick={() => {
                          setEditId(p.id);
                          setEditAmount(p.amount.toString());
                        }}
                      >
                        Edit Salary
                      </button>
                      {!p.paid && (
                        <button
                          className="text-green-600 text-xs"
                          onClick={() => handleMarkPaid(p.id)}
                        >
                          Mark as Paid
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            <tr className="bg-blue-100 dark:bg-blue-900/20 font-bold">
              <td className="p-2">Total</td>
              <td className="p-2"></td>
              <td className="p-2">₦{totalPayroll.toLocaleString()}</td>
              <td className="p-2"></td>
              <td className="p-2"></td>
              {user?.role === "ADMIN" && <td className="p-2"></td>}
            </tr>
          </tbody>
        </table>
      ) : (
        <div className="text-sm text-[--muted-foreground] mt-4">
          Payroll is empty for this period.
        </div>
      )}
      {/* Edit Salary Modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-blue-900/40 rounded-lg p-6 shadow-lg w-full max-w-sm">
            <h3 className="font-semibold mb-4">Edit Salary</h3>
            <form onSubmit={handleEditSalary} className="space-y-4">
              <input
                type="number"
                placeholder="Amount"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                required
              />
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
    </div>
  );
}
