"use client";

import type { Payroll } from "@/lib/types/payroll";
import type { Staff } from "@/lib/types/staff";
import { usePayroll } from "@/lib/hooks/usePayroll";
import { useAuthStore } from "@/lib/stores/authStore";
import { useStaff } from "@/lib/hooks/useStaff";
import ByteDatePicker from "byte-datepicker";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function PayrollTable() {
  const user = useAuthStore((state) => state.user);
  const {
    payroll,
    isLoading,
    refetch,
    markPaid,
    editSalary,
    generatePayroll,
    bulkMarkPaid,
  } = usePayroll();
  const { staff } = useStaff();

  // Filter controls
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const year = selectedDate
    ? selectedDate.getFullYear()
    : new Date().getFullYear();
  const month = selectedDate
    ? selectedDate.getMonth() + 1
    : new Date().getMonth() + 1;

  // Edit modal state
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editing, setEditing] = useState(false);

  // Role-based payroll filter
  const filteredPayroll = useMemo(() => {
    if (!payroll) return [];
    if (user?.role === "ADMIN") {
      return payroll as Payroll[];
    }
    if (user?.role === "SUB_ADMIN" && user?.departmentId) {
      const deptStaffIds = staff
        ?.filter((s: Staff) => s.departmentId === user.departmentId)
        .map((s: Staff) => s.id);
      return (payroll as Payroll[]).filter(
        (p: Payroll) =>
          deptStaffIds?.includes(p.staffId) &&
          new Date(p.period).getFullYear() === year &&
          new Date(p.period).getMonth() + 1 === month
      );
    }
    if (user?.role === "STAFF") {
      return (payroll as Payroll[]).filter(
        (p: Payroll) =>
          p.staffId === user.id &&
          new Date(p.period).getFullYear() === year &&
          new Date(p.period).getMonth() + 1 === month
      );
    }
    return [];
  }, [payroll, user, staff, year, month]);

  // Total payroll for the month
  const totalPayroll = filteredPayroll.reduce(
    (sum: number, p: any) => sum + p.amount,
    0
  );

  async function handleBulkMarkPaid() {
    if (!user?.departmentId) return;
    try {
      await bulkMarkPaid.mutateAsync({
        departmentId: user.departmentId,
        year,
        month,
      });
      toast.success("Bulk marked as paid!");
      refetch();
    } catch {
      toast.error("Failed to bulk mark as paid");
    }
  }

  async function handleGeneratePayroll() {
    if (!user?.businessId) return;
    try {
      await generatePayroll.mutateAsync({
        businessId: user.businessId,
        year,
        month,
      });
      toast.success("Payroll generated!");
      refetch();
    } catch {
      toast.error("Failed to generate payroll");
    }
  }

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
      <div className="flex gap-2 mb-4 items-center">
        <ByteDatePicker
          value={selectedDate}
          onChange={setSelectedDate}
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
        {user?.role === "ADMIN" && (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleGeneratePayroll}
            disabled={generatePayroll.isPending}
          >
            {generatePayroll.isPending ? "Generating..." : "Generate Payroll"}
          </button>
        )}
        {user?.role === "SUB_ADMIN" && (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleBulkMarkPaid}
            disabled={bulkMarkPaid.isPending}
          >
            {bulkMarkPaid.isPending ? "Marking..." : "Bulk Mark Paid"}
          </button>
        )}
      </div>
      <div className="mb-2 font-semibold">
        Total Payroll: ₦{totalPayroll.toLocaleString()}
      </div>
      {isLoading ? (
        <div>Loading payroll...</div>
      ) : filteredPayroll.length ? (
        <table className="w-full border rounded">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Department</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Period</th>
              {user?.role === "ADMIN" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredPayroll.map((p: Payroll) => (
              <tr key={p.id}>
                <td>
                  {p.staff?.user?.fullName ?? p.staff?.user?.email ?? "Unknown"}
                </td>
                <td>{p.staff?.department?.name ?? "-"}</td>
                <td>₦{p.amount.toLocaleString()}</td>
                <td>{p.paid ? "Yes" : "No"}</td>
                <td>
                  {new Date(p.period).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "short",
                  })}
                </td>
                {user?.role === "ADMIN" && (
                  <td>
                    <button
                      className="text-blue-600 mr-2"
                      onClick={() => {
                        setEditId(p.id);
                        setEditAmount(p.amount.toString());
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-green-600"
                      onClick={() => handleMarkPaid(p.id)}
                      disabled={p.paid}
                    >
                      Mark Paid
                    </button>
                  </td>
                )}
              </tr>
            ))}
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
            <form onSubmit={handleEditSalary} className="space-y-4">
              <label className="block text-sm font-medium">Edit Salary</label>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                required
                min={0}
                className="border rounded px-3 py-2 w-full"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  className="px-4 py-2 rounded bg-gray-200"
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
