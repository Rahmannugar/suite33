"use client";

import { useDepartments } from "@/lib/hooks/useDepartments";
import { useStaff } from "@/lib/hooks/useStaff";
import { useAuthStore } from "@/lib/stores/authStore";
import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";

function formatDeptName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function DepartmentManager() {
  const { departments, createDepartment, editDepartment, deleteDepartment } =
    useDepartments();
  const {
    staff,
    isLoading: loadingStaff,
    promoteStaff,
    demoteStaff,
    moveStaff,
    removeStaff,
  } = useStaff();
  const user = useAuthStore((s) => s.user);
  const canAdmin = user?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [openDialog, setOpenDialog] = useState<{
    type:
      | null
      | "create"
      | "move"
      | "unassign"
      | "remove"
      | "promote"
      | "demote";
    targetId?: string;
  }>({ type: null });

  const [form, setForm] = useState({
    deptName: "",
    moveDeptId: "",
  });
  const [saving, setSaving] = useState(false);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    let base = staff;
    if (selectedDept === "none") base = staff.filter((s) => !s.departmentId);
    else if (selectedDept !== "all")
      base = staff.filter((s) => s.departmentId === selectedDept);
    if (normalizedSearch)
      base = base.filter(
        (s) =>
          s.user.fullName?.toLowerCase().includes(normalizedSearch) ||
          s.user.email?.toLowerCase().includes(normalizedSearch)
      );
    return base;
  }, [staff, selectedDept, normalizedSearch]);

  const totalPages = Math.ceil(filteredStaff.length / perPage);
  const paginatedStaff = filteredStaff.slice(
    (page - 1) * perPage,
    page * perPage
  );

  async function handleCreateDept() {
    if (!form.deptName.trim()) return toast.error("Enter a department name");
    if (!user?.businessId) return toast.error("Missing business");
    setSaving(true);
    try {
      await createDepartment.mutateAsync({
        name: form.deptName.trim().toLowerCase(),
        businessId: user.businessId,
      });
      toast.success("Department created");
      setForm({ ...form, deptName: "" });
      setOpenDialog({ type: null });
    } catch {
      toast.error("Failed to create department");
    } finally {
      setSaving(false);
    }
  }

  async function handleMoveStaff() {
    if (!openDialog.targetId || !form.moveDeptId)
      return toast.error("Select a department");
    setSaving(true);
    try {
      await moveStaff.mutateAsync({
        staffId: openDialog.targetId,
        departmentId: form.moveDeptId,
      });
      toast.success("Staff moved");
      setOpenDialog({ type: null });
    } catch {
      toast.error("Failed to move staff");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnassignStaff() {
    if (!openDialog.targetId) return;
    setSaving(true);
    try {
      await removeStaff.mutateAsync({ staffId: openDialog.targetId });
      toast.success("Staff unassigned");
      setOpenDialog({ type: null });
    } catch {
      toast.error("Failed to unassign staff");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveFromBusiness() {
    if (!openDialog.targetId) return;
    setSaving(true);
    try {
      await fetch("/api/staff/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: openDialog.targetId }),
      });
      toast.success("Staff removed from business");
      setOpenDialog({ type: null });
    } catch {
      toast.error("Failed to remove staff");
    } finally {
      setSaving(false);
    }
  }

  async function handlePromote() {
    if (!openDialog.targetId) return;
    setSaving(true);
    try {
      await promoteStaff.mutateAsync({ staffId: openDialog.targetId });
      toast.success("Promoted to Assistant Admin");
      setOpenDialog({ type: null });
    } catch {
      toast.error("Failed to promote");
    } finally {
      setSaving(false);
    }
  }

  async function handleDemote() {
    if (!openDialog.targetId) return;
    setSaving(true);
    try {
      await demoteStaff.mutateAsync({ staffId: openDialog.targetId });
      toast.success("Demoted to Staff");
      setOpenDialog({ type: null });
    } catch {
      toast.error("Failed to demote");
    } finally {
      setSaving(false);
    }
  }

  const headerLabel =
    selectedDept === "all"
      ? "All Staff"
      : selectedDept === "none"
      ? "Staff Without a Department"
      : `${formatDeptName(
          departments?.find((d) => d.id === selectedDept)?.name ?? ""
        )} Staff`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">Department Management</h2>
        {canAdmin && (
          <div className="flex gap-2">
            <Button
              className="cursor-pointer"
              onClick={() => setOpenDialog({ type: "create" })}
            >
              New Department
            </Button>
            <Link href="/dashboard/admin/invite">
              <Button className="cursor-pointer" variant="outline">
                Invite Staff
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search staff by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments?.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {formatDeptName(d.name)}
              </SelectItem>
            ))}
            <SelectItem value="none">No Department</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {headerLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStaff ? (
            <p className="text-sm text-muted-foreground">Loading staff...</p>
          ) : paginatedStaff.length === 0 ? (
            <p className="text-sm text-muted-foreground">No staff found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left">S/N</th>
                    <th className="p-3 text-left">Full Name</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Role</th>
                    {canAdmin && <th className="p-3 text-left">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedStaff.map((s, i) => (
                    <tr key={s.id} className="border-t hover:bg-muted/50">
                      <td className="p-3">{(page - 1) * perPage + i + 1}</td>
                      <td className="p-3 font-medium">
                        {s.user.fullName || "—"}
                      </td>
                      <td className="p-3">{s.user.email}</td>
                      <td className="p-3 capitalize">
                        {s.user.role === "SUB_ADMIN"
                          ? "Assistant Admin"
                          : "Staff"}
                      </td>
                      {canAdmin && (
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() =>
                                setOpenDialog({ type: "move", targetId: s.id })
                              }
                            >
                              Move
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() =>
                                setOpenDialog({
                                  type: "unassign",
                                  targetId: s.id,
                                })
                              }
                            >
                              Unassign
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() =>
                                setOpenDialog({
                                  type: "remove",
                                  targetId: s.id,
                                })
                              }
                            >
                              Remove
                            </Button>
                            {s.user.role === "SUB_ADMIN" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                onClick={() =>
                                  setOpenDialog({
                                    type: "demote",
                                    targetId: s.id,
                                  })
                                }
                              >
                                Demote
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                onClick={() =>
                                  setOpenDialog({
                                    type: "promote",
                                    targetId: s.id,
                                  })
                                }
                              >
                                Promote
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={openDialog.type === "create"}
        onOpenChange={() => setOpenDialog({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Department name"
            value={form.deptName}
            onChange={(e) => setForm({ ...form, deptName: e.target.value })}
          />
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setOpenDialog({ type: null })}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleCreateDept}
              disabled={saving}
            >
              {saving ? "Saving..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openDialog.type === "move"}
        onOpenChange={() => setOpenDialog({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Staff</DialogTitle>
          </DialogHeader>
          <Select
            value={form.moveDeptId}
            onValueChange={(v) => setForm({ ...form, moveDeptId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {formatDeptName(d.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setOpenDialog({ type: null })}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleMoveStaff}
              disabled={saving}
            >
              {saving ? "Moving..." : "Move"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {[
        {
          type: "unassign",
          title: "Unassign Staff",
          action: handleUnassignStaff,
          label: "Unassign",
        },
        {
          type: "remove",
          title: "Remove Staff from Business",
          action: handleRemoveFromBusiness,
          label: "Remove",
        },
        {
          type: "promote",
          title: "Promote Staff",
          action: handlePromote,
          label: "Promote",
        },
        {
          type: "demote",
          title: "Demote Staff",
          action: handleDemote,
          label: "Demote",
        },
      ].map(
        (d) =>
          openDialog.type === d.type && (
            <Dialog
              key={d.type}
              open
              onOpenChange={() => setOpenDialog({ type: null })}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{d.title}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  {d.type === "remove"
                    ? "This will permanently remove the staff from your business."
                    : "Are you sure you want to perform this action?"}
                </p>
                <DialogFooter>
                  <Button
                    className="cursor-pointer"
                    variant="outline"
                    onClick={() => setOpenDialog({ type: null })}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="cursor-pointer"
                    variant={d.type === "remove" ? "destructive" : "default"}
                    onClick={d.action}
                    disabled={saving}
                  >
                    {saving ? "Processing..." : d.label}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
      )}
    </div>
  );
}
