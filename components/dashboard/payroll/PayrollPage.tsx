"use client";

import { useState, useMemo } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { usePayroll } from "@/lib/hooks/payroll/usePayroll";
import { useStaff } from "@/lib/hooks/business/useStaff";
import { useDepartments } from "@/lib/hooks/business/useDepartments";
import { toast } from "sonner";
import ByteDatePicker from "byte-datepicker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function PayrollPage() {
  const user = useAuthStore((state) => state.user);
  const {
    payroll,
    isLoading,
    markPaid,
    editSalary,
    generatePayroll,
    bulkMarkPaid,
  } = usePayroll();
  const { staff } = useStaff();
  const { departments } = useDepartments();

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const year = selectedDate
    ? selectedDate.getFullYear()
    : new Date().getFullYear();
  const month = selectedDate
    ? selectedDate.getMonth() + 1
    : new Date().getMonth() + 1;

  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editing, setEditing] = useState(false);

  const [bulkDeptId, setBulkDeptId] = useState<string>("all");

  const filteredPayroll = useMemo(() => {
    if (!payroll) return [];
    if (user?.role === "ADMIN") {
      return (payroll as any[]).filter(
        (p) =>
          new Date(p.period).getFullYear() === year &&
          new Date(p.period).getMonth() + 1 === month
      );
    }
    if (user?.role === "SUB_ADMIN" && user?.departmentId) {
      const deptStaffIds = staff
        ?.filter((s) => s.departmentId === user.departmentId)
        .map((s) => s.id);
      return (payroll as any[]).filter(
        (p) =>
          deptStaffIds?.includes(p.staffId) &&
          new Date(p.period).getFullYear() === year &&
          new Date(p.period).getMonth() + 1 === month
      );
    }
    if (user?.role === "STAFF") {
      return (payroll as any[]).filter(
        (p) =>
          p.staffId === user.id &&
          new Date(p.period).getFullYear() === year &&
          new Date(p.period).getMonth() + 1 === month
      );
    }
    return [];
  }, [payroll, user, staff, year, month]);

  const totalPayroll = filteredPayroll.reduce(
    (sum: number, p: any) => sum + p.amount,
    0
  );

  async function handleBulkMarkPaid() {
    if (user?.role !== "ADMIN") return;
    if (bulkDeptId === "all") {
      for (const dept of departments ?? []) {
        await bulkMarkPaid.mutateAsync({
          departmentId: dept.id,
          year,
          month,
        });
      }
      toast.success("Bulk marked as paid for all departments!");
    } else {
      await bulkMarkPaid.mutateAsync({
        departmentId: bulkDeptId,
        year,
        month,
      });
      toast.success("Bulk marked as paid for selected department!");
    }
  }

  async function handleGeneratePayroll() {
    if (user?.role !== "ADMIN" || !user?.businessId) return;
    await generatePayroll.mutateAsync({
      year,
      month,
    });
    toast.success("Payroll generated!");
  }

  async function handleMarkPaid(id: string) {
    if (user?.role !== "ADMIN") return;
    await markPaid.mutateAsync(id);
    toast.success("Marked as paid!");
  }

  async function handleEditSalary(e: React.FormEvent) {
    e.preventDefault();
    if (user?.role !== "ADMIN" || !editId || !editAmount) return;
    setEditing(true);
    await editSalary.mutateAsync({
      id: editId,
      amount: parseFloat(editAmount),
    });
    toast.success("Salary updated!");
    setEditId(null);
    setEditAmount("");
    setEditing(false);
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Payroll</h2>
      <div className="flex gap-2 mb-4 items-center">
        <ByteDatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          formatString="mmm yyyy"
          hideInput={false}
        />
        {user?.role === "ADMIN" && (
          <>
            <button
              onClick={handleGeneratePayroll}
              className="bg-blue-600 text-white px-4 py-2 rounded"
              disabled={generatePayroll.isPending}
            >
              {generatePayroll.isPending ? "Generating..." : "Generate Payroll"}
            </button>
            <Select value={bulkDeptId} onValueChange={setBulkDeptId}>
              <SelectTrigger className="max-w-xs w-full rounded-lg border border-[--input] bg-transparent p-3 font-medium">
                <SelectValue>
                  {bulkDeptId === "all"
                    ? "All Departments"
                    : departments
                        ?.find((d) => d.id === bulkDeptId)
                        ?.name.toUpperCase() ?? ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={handleBulkMarkPaid}
              className="bg-green-600 text-white px-4 py-2 rounded"
              disabled={bulkMarkPaid.isPending}
            >
              {bulkMarkPaid.isPending ? "Marking..." : "Bulk Mark Paid"}
            </button>
          </>
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
              <th>Amount</th>
              <th>Paid</th>
              <th>Period</th>
              {user?.role === "ADMIN" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredPayroll.map((p: any) => (
              <tr key={p.id}>
                <td>
                  {p.staff?.user?.fullName || p.staff?.user?.email || "-"}
                </td>
                <td>₦{p.amount.toLocaleString()}</td>
                <td>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      p.paid
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {p.paid ? "Paid" : "Pending"}
                  </span>
                </td>
                <td>
                  {new Date(p.period).toLocaleString("default", {
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                {user?.role === "ADMIN" && (
                  <td>
                    {!p.paid && (
                      <button
                        className="text-green-600 hover:underline mr-2"
                        onClick={() => handleMarkPaid(p.id)}
                        disabled={markPaid.isPending}
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => {
                        setEditId(p.id);
                        setEditAmount(p.amount.toString());
                      }}
                    >
                      Edit Salary
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-sm text-[--muted-foreground] mt-4">
          No payroll records for this period.
        </div>
      )}
      {editId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-blue-900/40 rounded-lg p-6 shadow-lg w-full max-w-sm">
            <form onSubmit={handleEditSalary} className="space-y-4">
              <input
                type="number"
                placeholder="Salary amount"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                  disabled={editing}
                >
                  {editing ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                  onClick={() => setEditId(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
