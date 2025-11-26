"use client";
import { useState } from "react";
import { usePayroll } from "@/lib/hooks/payroll/usePayroll";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function SinglePayrollPage({ id }: { id: string }) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const { batch, updateBatch, updateItem, exportCSV, exportExcel } =
    usePayroll();
  const query = batch(id);

  const [lockLoading, setLockLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItemState, setEditItemState] = useState<any | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editPaid, setEditPaid] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  if (query.isLoading || !query.data) {
    return <Skeleton className="h-40 w-full rounded-md" />;
  }

  const data: any = query.data;
  const isSelfView = !Array.isArray(data.items);

  const periodLabel = new Date(data.period).toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

  function handleExportCSV() {
    if (!Array.isArray(data.items) || !data.items.length) return;
    const rows = data.items.map((i: any) => ({
      Name: i.staff?.user.fullName ?? "",
      Email: i.staff?.user.email ?? "",
      Role: i.staff?.user.role ?? "",
      Amount: String(i.amount),
      Paid: i.paid,
    }));
    exportCSV(rows, `Payroll ${periodLabel}`);
  }

  function handleExportExcel() {
    if (!Array.isArray(data.items) || !data.items.length) return;
    const rows = data.items.map((i: any) => ({
      Name: i.staff?.user.fullName ?? "",
      Email: i.staff?.user.email ?? "",
      Role: i.staff?.user.role ?? "",
      Amount: String(i.amount),
      Paid: i.paid,
    }));
    exportExcel(rows, `Payroll ${periodLabel}`);
  }

  async function handleToggleLock() {
    if (!isAdmin) return;
    try {
      setLockLoading(true);
      await updateBatch.mutateAsync({ id, locked: !data.locked });
      toast.success(data.locked ? "Batch unlocked" : "Batch locked");
    } catch {
      toast.error("Failed to update batch");
    } finally {
      setLockLoading(false);
    }
  }

  function openEdit(item: any) {
    setEditItemState(item);
    setEditAmount(String(item.amount));
    setEditPaid(item.paid);
    setEditOpen(true);
  }

  async function handleSaveItem() {
    if (!editItemState) return;
    try {
      setSavingItem(true);
      await updateItem.mutateAsync({
        batchId: id,
        itemId: editItemState.id,
        amount: Number(editAmount),
        paid: editPaid,
      });
      toast.success("Payroll updated");
      setEditOpen(false);
      setEditItemState(null);
    } catch {
      toast.error("Failed to update payroll");
    } finally {
      setSavingItem(false);
    }
  }

  return (
    <>
      <div className="px-4 lg:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl font-semibold">Payroll • {periodLabel}</h1>

          {isAdmin && !isSelfView && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={handleToggleLock}
                disabled={lockLoading}
              >
                {lockLoading
                  ? "Updating..."
                  : data.locked
                  ? "Unlock Batch"
                  : "Lock Batch"}
              </Button>

              {Array.isArray(data.items) && data.items.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={handleExportCSV}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={handleExportExcel}
                  >
                    Export Excel
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {isSelfView ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                My Payroll
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!data.item ? (
                <p className="text-sm text-muted-foreground">
                  No payroll record for this period.
                </p>
              ) : (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Amount: </span>
                    <span className="font-medium">{data.item.amount}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Status: </span>
                    <span className="font-medium">
                      {data.item.paid ? "Paid" : "Not paid"}
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Payroll Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!Array.isArray(data.items) || !data.items.length ? (
                <p className="text-sm text-muted-foreground">
                  No payroll data found for this batch.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S/N</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        {isAdmin && (
                          <TableHead className="w-40">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map((i: any, idx: number) => (
                        <TableRow key={i.id} className="hover:bg-muted/40">
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{i.staff?.user.fullName ?? "-"}</TableCell>
                          <TableCell>{i.staff?.user.email ?? "-"}</TableCell>
                          <TableCell>
                            {i.staff?.user.role === "SUB_ADMIN"
                              ? "Assistant Admin"
                              : "Staff"}
                          </TableCell>
                          <TableCell>₦{i.amount.toLocaleString()}</TableCell>
                          <TableCell>{i.paid ? "Yes" : "No"}</TableCell>

                          {isAdmin && (
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                onClick={() => openEdit(i)}
                              >
                                Edit
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit payroll</DialogTitle>
          </DialogHeader>

          {editItemState && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {editItemState.staff?.user.fullName ??
                  editItemState.staff?.user.email ??
                  ""}
              </p>

              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="Amount"
              />

              <Select
                value={editPaid ? "yes" : "no"}
                onValueChange={(v) => setEditPaid(v === "yes")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Not paid</SelectItem>
                  <SelectItem value="yes">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setEditOpen(false)}
              disabled={savingItem}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleSaveItem}
              disabled={savingItem}
            >
              {savingItem ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
