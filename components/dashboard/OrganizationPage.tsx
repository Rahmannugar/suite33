"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/authStore";
import { useDepartments } from "@/lib/hooks/useDepartments";
import { useStaff } from "@/lib/hooks/useStaff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";

function formatDeptName(name = "") {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function truncateText(text = "", max = 20) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

type DialogType =
  | null
  | "create-dept"
  | "rename-dept"
  | "delete-dept"
  | "move-staff"
  | "unassign-staff"
  | "delete-staff"
  | "promote"
  | "demote";

export default function OrganizationPage() {
  const user = useAuthStore((s) => s.user);
  const canMutate = user?.role === "ADMIN";
  const { departments, createDepartment, editDepartment, deleteDepartment } =
    useDepartments();
  const {
    staff,
    isLoading: loadingStaff,
    promoteStaff,
    demoteStaff,
    moveStaff,
    removeStaff,
    deleteStaff,
  } = useStaff();

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [staffPage, setStaffPage] = useState(1);
  const [deptPage, setDeptPage] = useState(1);
  const [showDepartments, setShowDepartments] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [dialogTargetId, setDialogTargetId] = useState<string | null>(null);
  const [dialogDeptId, setDialogDeptId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    deptName: "",
    moveDeptId: "",
    rename: "",
  });

  const staffPerPage = 10;
  const deptPerPage = 10;

  useEffect(() => setStaffPage(1), [selectedDept, search]);
  useEffect(() => setDeptPage(1), [departments?.length]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    let base = staff.slice();
    if (selectedDept === "none") base = base.filter((s) => !s.departmentId);
    else if (selectedDept !== "all")
      base = base.filter((s) => s.departmentId === selectedDept);
    if (normalizedSearch) {
      base = base.filter(
        (s) =>
          (s.user.fullName || "").toLowerCase().includes(normalizedSearch) ||
          (s.user.email || "").toLowerCase().includes(normalizedSearch)
      );
    }
    return base.sort((a, b) =>
      (a.user.fullName || "").localeCompare(b.user.fullName || "")
    );
  }, [staff, selectedDept, normalizedSearch]);

  const totalStaffPages = Math.ceil(filteredStaff.length / staffPerPage);
  const paginatedStaff = filteredStaff.slice(
    (staffPage - 1) * staffPerPage,
    staffPage * staffPerPage
  );

  const sortedDepts = useMemo(() => {
    return (departments ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [departments]);

  const deptWithCounts = useMemo(() => {
    const map: Record<string, number> = {};
    (staff ?? []).forEach((s) => {
      if (s.departmentId) map[s.departmentId] = (map[s.departmentId] || 0) + 1;
    });
    return sortedDepts.map((d) => ({ ...d, members: map[d.id] || 0 }));
  }, [sortedDepts, staff]);

  const totalDeptPages = Math.ceil(deptWithCounts.length / deptPerPage);
  const paginatedDepts = deptWithCounts.slice(
    (deptPage - 1) * deptPerPage,
    deptPage * deptPerPage
  );

  function resetDialogState() {
    setDialogType(null);
    setDialogTargetId(null);
    setDialogDeptId(null);
    setForm({ deptName: "", moveDeptId: "", rename: "" });
  }

  async function handleCreateDept() {
    if (!form.deptName.trim()) return toast.error("Enter a department name");
    if (!user?.businessId) return toast.error("Missing business");
    setSaving(true);
    try {
      await createDepartment.mutateAsync({
        name: form.deptName.trim().toLowerCase(),
      });
      toast.success("Department created");
      resetDialogState();
      setSaving(false);
    } catch {
      toast.error("Failed to create department");
      setSaving(false);
    }
  }

  async function handleRenameDept() {
    if (!dialogDeptId) return;
    if (!form.rename.trim()) return toast.error("Enter a department name");
    setSaving(true);
    try {
      await editDepartment.mutateAsync({
        id: dialogDeptId,
        name: form.rename.trim().toLowerCase(),
      });
      toast.success("Department renamed");
      resetDialogState();
      setSaving(false);
    } catch {
      toast.error("Failed to rename department");
      setSaving(false);
    }
  }

  async function handleDeleteDept() {
    if (!dialogDeptId) return;
    setSaving(true);
    try {
      await deleteDepartment.mutateAsync(dialogDeptId);
      toast.success("Department deleted");
      resetDialogState();
      setSaving(false);
    } catch (err: any) {
      if (err?.response?.status === 400) {
        toast.error(
          "Cannot delete department with members. Reassign or remove members first."
        );
      } else {
        toast.error("Failed to delete department");
      }
      setSaving(false);
    }
  }

  function getCurrentDeptIdForStaff(staffId: string | null) {
    if (!staffId || !staff) return "";
    return staff.find((s) => s.id === staffId)?.departmentId ?? "";
  }

  async function handleMoveStaff() {
    if (!dialogTargetId) return toast.error("Missing staff");
    const currentDeptId = getCurrentDeptIdForStaff(dialogTargetId);
    const targetDeptId = form.moveDeptId;
    if (!targetDeptId) return toast.error("Select a department");
    if (targetDeptId === currentDeptId) {
      resetDialogState();
      return;
    }
    setSaving(true);
    try {
      await moveStaff.mutateAsync({
        staffId: dialogTargetId,
        departmentId: targetDeptId,
      });
      toast.success("Staff moved");
      resetDialogState();
      setSaving(false);
    } catch {
      toast.error("Failed to move staff");
      setSaving(false);
    }
  }

  async function handleUnassignStaff() {
    if (!dialogTargetId) return;
    const currentDeptId = getCurrentDeptIdForStaff(dialogTargetId);
    if (!currentDeptId) {
      resetDialogState();
      return;
    }
    setSaving(true);
    try {
      await removeStaff.mutateAsync({ staffId: dialogTargetId });
      toast.success("Staff unassigned");
      resetDialogState();
      setSaving(false);
    } catch {
      toast.error("Failed to unassign staff");
      setSaving(false);
    }
  }

  async function handleDeleteStaff() {
    if (!dialogTargetId) return;
    setSaving(true);
    try {
      await deleteStaff.mutateAsync({ staffId: dialogTargetId });
      toast.success("Staff removed from business");
      resetDialogState();
      setSaving(false);
    } catch {
      toast.error("Failed to remove staff");
      setSaving(false);
    }
  }

  async function handlePromote() {
    if (!dialogTargetId) return;
    setSaving(true);
    try {
      await promoteStaff.mutateAsync({ staffId: dialogTargetId });
      toast.success("Promoted to Assistant Admin");
      resetDialogState();
      setSaving(false);
    } catch {
      toast.error("Failed to promote");
      setSaving(false);
    }
  }

  async function handleDemote() {
    if (!dialogTargetId) return;
    setSaving(true);
    try {
      await demoteStaff.mutateAsync({ staffId: dialogTargetId });
      toast.success("Demoted to Staff");
      resetDialogState();
      setSaving(false);
    } catch {
      toast.error("Failed to demote");
      setSaving(false);
    }
  }

  const openDialogSafely = (
    type: DialogType,
    opts?: { staffId?: string; deptId?: string }
  ) => {
    setDialogType(type);
    setDialogTargetId(opts?.staffId ?? null);
    setDialogDeptId(opts?.deptId ?? null);
    if (type === "move-staff") {
      const current = opts?.staffId
        ? getCurrentDeptIdForStaff(opts.staffId)
        : "";
      setForm((f) => ({ ...f, moveDeptId: current ?? "" }));
    }
    if (type === "rename-dept") {
      setForm((f) => ({
        ...f,
        rename: opts?.deptId
          ? departments?.find((d) => d.id === opts.deptId)?.name ?? ""
          : "",
      }));
      setDialogDeptId(opts?.deptId ?? null);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold">Organization</h2>
          {canMutate && (
            <div className="flex gap-2">
              <Button
                className="cursor-pointer"
                onClick={() => openDialogSafely("create-dept")}
              >
                New Department
              </Button>
              <Link href="/dashboard/admin/invite">
                <Button className="cursor-pointer" variant="outline">
                  Invite Staff
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setShowDepartments((v) => !v)}
                className="cursor-pointer ml-2"
              >
                {showDepartments ? "Hide Departments" : "Manage Departments"}
              </Button>
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
          <Select
            value={selectedDept}
            onValueChange={(v) => setSelectedDept(v)}
          >
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
              {selectedDept === "all"
                ? "All Staff"
                : selectedDept === "none"
                ? "Staff Without a Department"
                : `${formatDeptName(
                    departments?.find((d) => d.id === selectedDept)?.name ?? ""
                  )} Staff`}
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
                      {canMutate && <th className="p-3 text-left">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStaff.map((s, i) => {
                      const dept =
                        departments?.find((d) => d.id === s.departmentId) ??
                        null;
                      const fullName = s.user.fullName || "—";
                      const email = s.user.email || "";
                      return (
                        <tr key={s.id} className="border-t hover:bg-muted/50">
                          <td className="p-3">
                            {(staffPage - 1) * staffPerPage + i + 1}
                          </td>
                          <td className="p-3 font-medium">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-block max-w-[260px] truncate">
                                  {truncateText(fullName, 25)}
                                </span>
                              </TooltipTrigger>
                              {fullName.length > 25 && (
                                <TooltipContent>{fullName}</TooltipContent>
                              )}
                            </Tooltip>
                          </td>
                          <td className="p-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-block max-w-[300px] truncate">
                                  {truncateText(email, 30)}
                                </span>
                              </TooltipTrigger>
                              {email.length > 30 && (
                                <TooltipContent>{email}</TooltipContent>
                              )}
                            </Tooltip>
                          </td>
                          <td className="p-3 capitalize">
                            {s.user.role === "SUB_ADMIN"
                              ? "Assistant Admin"
                              : "Staff"}
                          </td>
                          {canMutate && (
                            <td className="p-3">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 min-w-[80px] cursor-pointer"
                                  onClick={() => {
                                    setForm((f) => ({
                                      ...f,
                                      moveDeptId: "",
                                    }));
                                    openDialogSafely("move-staff", {
                                      staffId: s.id,
                                    });
                                  }}
                                >
                                  Move
                                </Button>

                                {s.departmentId && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 min-w-[80px] cursor-pointer"
                                    onClick={() =>
                                      openDialogSafely("unassign-staff", {
                                        staffId: s.id,
                                      })
                                    }
                                  >
                                    Unassign
                                  </Button>
                                )}

                                {s.user.role === "SUB_ADMIN" ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 min-w-[80px] cursor-pointer"
                                    onClick={() =>
                                      openDialogSafely("demote", {
                                        staffId: s.id,
                                      })
                                    }
                                  >
                                    Demote
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 min-w-[80px] cursor-pointer"
                                    onClick={() =>
                                      openDialogSafely("promote", {
                                        staffId: s.id,
                                      })
                                    }
                                  >
                                    Promote
                                  </Button>
                                )}

                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="flex-1 min-w-[80px] cursor-pointer"
                                  onClick={() =>
                                    openDialogSafely("delete-staff", {
                                      staffId: s.id,
                                    })
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {totalStaffPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setStaffPage((p) => Math.max(1, p - 1))}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalStaffPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setStaffPage(i + 1)}
                        isActive={staffPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setStaffPage((p) => Math.min(totalStaffPages, p + 1))
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>

        <AnimatePresence>
          {canMutate && showDepartments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24 }}
              className="overflow-hidden"
            >
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">
                    Manage Departments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {deptWithCounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No departments found.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border rounded">
                        <thead className="bg-muted">
                          <tr>
                            <th className="p-3 text-left">S/N</th>
                            <th className="p-3 text-left">Name</th>
                            <th className="p-3 text-left">Members</th>
                            <th className="p-3 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedDepts.map((d, i) => (
                            <tr
                              key={d.id}
                              className="border-t hover:bg-muted/50"
                            >
                              <td className="p-3">
                                {(deptPage - 1) * deptPerPage + i + 1}
                              </td>
                              <td className="p-3">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-block max-w-[160px] truncate">
                                      {truncateText(formatDeptName(d.name), 10)}
                                    </span>
                                  </TooltipTrigger>
                                  {d.name.length > 10 && (
                                    <TooltipContent>
                                      {formatDeptName(d.name)}
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </td>
                              <td className="p-3">{d.members}</td>
                              <td className="p-3 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="cursor-pointer"
                                  onClick={() => {
                                    setForm((f) => ({ ...f, rename: d.name }));
                                    openDialogSafely("rename-dept", {
                                      deptId: d.id,
                                    });
                                  }}
                                >
                                  Rename
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="cursor-pointer"
                                  onClick={() =>
                                    openDialogSafely("delete-dept", {
                                      deptId: d.id,
                                    })
                                  }
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {totalDeptPages > 1 && (
                    <Pagination className="mt-4">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setDeptPage((p) => Math.max(1, p - 1))
                            }
                          />
                        </PaginationItem>
                        {Array.from({ length: totalDeptPages }, (_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => setDeptPage(i + 1)}
                              isActive={deptPage === i + 1}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setDeptPage((p) =>
                                Math.min(totalDeptPages, p + 1)
                              )
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Dialog
          open={dialogType !== null}
          onOpenChange={(open) => {
            if (!open) resetDialogState();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogType === "create-dept" && "Create Department"}
                {dialogType === "rename-dept" && "Rename Department"}
                {dialogType === "delete-dept" && "Delete Department"}
                {dialogType === "move-staff" && "Move Staff"}
                {dialogType === "unassign-staff" && "Unassign Staff"}
                {dialogType === "delete-staff" && "Remove Staff from Business"}
                {dialogType === "promote" && "Promote Staff"}
                {dialogType === "demote" && "Demote Staff"}
              </DialogTitle>
            </DialogHeader>

            {dialogType === "create-dept" && (
              <>
                <Input
                  placeholder="Department name"
                  value={form.deptName}
                  onChange={(e) =>
                    setForm({ ...form, deptName: e.target.value })
                  }
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => resetDialogState()}
                    disabled={saving}
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
              </>
            )}

            {dialogType === "rename-dept" && (
              <>
                <Input
                  placeholder="New department name"
                  value={form.rename}
                  onChange={(e) => setForm({ ...form, rename: e.target.value })}
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => resetDialogState()}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="cursor-pointer"
                    onClick={handleRenameDept}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </>
            )}

            {dialogType === "delete-dept" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this department?
                </p>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => resetDialogState()}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={handleDeleteDept}
                    disabled={saving}
                  >
                    {saving ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </>
            )}

            {dialogType === "move-staff" && (
              <>
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
                    onClick={() => resetDialogState()}
                    disabled={saving}
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
              </>
            )}

            {dialogType === "unassign-staff" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to remove this staff from{" "}
                  <strong>
                    {(() => {
                      const name = getCurrentDeptIdForStaff(dialogTargetId)
                        ? departments?.find(
                            (d) =>
                              d.id ===
                              staff?.find((s) => s.id === dialogTargetId)
                                ?.departmentId
                          )?.name ?? ""
                        : "";
                      return name ? formatDeptName(name) : "the";
                    })()}
                  </strong>{" "}
                  department?
                </p>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => resetDialogState()}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="cursor-pointer"
                    onClick={handleUnassignStaff}
                    disabled={saving}
                  >
                    {saving ? "Processing..." : "Unassign"}
                  </Button>
                </DialogFooter>
              </>
            )}

            {dialogType === "delete-staff" && (
              <>
                <p className="text-sm text-muted-foreground">
                  This will permanently remove the staff from your business.
                </p>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => resetDialogState()}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={handleDeleteStaff}
                    disabled={saving}
                  >
                    {saving ? "Removing..." : "Remove"}
                  </Button>
                </DialogFooter>
              </>
            )}

            {dialogType === "promote" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Promote this staff to Assistant Admin?
                </p>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => resetDialogState()}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="cursor-pointer"
                    onClick={handlePromote}
                    disabled={saving}
                  >
                    {saving ? "Processing..." : "Promote"}
                  </Button>
                </DialogFooter>
              </>
            )}

            {dialogType === "demote" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Demote this staff to Staff?
                </p>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => resetDialogState()}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="cursor-pointer"
                    onClick={handleDemote}
                    disabled={saving}
                  >
                    {saving ? "Processing..." : "Demote"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
