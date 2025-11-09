"use client";

import type { Department } from "@/lib/types/department";
import type { Staff } from "@/lib/types/staff";
import { useDepartments } from "@/lib/hooks/useDepartments";
import { useStaff } from "@/lib/hooks/useStaff";
import { useAuthStore } from "@/lib/stores/authStore";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

export default function DepartmentManager() {
  const {
    departments,
    isLoading: loadingDepts,
    createDepartment,
    editDepartment,
    deleteDepartment,
  } = useDepartments();
  const {
    staff,
    isLoading: loadingStaff,
    promoteStaff,
    demoteStaff,
    moveStaff,
    removeStaff,
  } = useStaff();
  const user = useAuthStore((s) => s.user);

  const [newDeptName, setNewDeptName] = useState("");
  const [creating, setCreating] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editingDeptSaving, setEditingDeptSaving] = useState(false);
  const [deletingDeptId, setDeletingDeptId] = useState<string | null>(null);
  const [deletingDeptSaving, setDeletingDeptSaving] = useState(false);

  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);

  const canAdmin = user?.role === "ADMIN";

  const deptsById = useMemo(() => {
    const map: Record<string, Department> = {};
    (departments ?? []).forEach((d) => (map[d.id] = d));
    return map;
  }, [departments]);

  async function handleCreateDepartment() {
    if (!newDeptName.trim()) return toast.error("Enter department name");
    if (!user?.businessId) return toast.error("Missing business");
    setCreating(true);
    try {
      await createDepartment.mutateAsync({
        name: newDeptName.trim(),
        businessId: user.businessId,
      });
      toast.success("Department created");
      setNewDeptName("");
    } catch {
      toast.error("Failed to create department");
    } finally {
      setCreating(false);
    }
  }

  function openEditDepartment(id: string, name: string) {
    setEditingDeptId(id);
    setEditDeptName(name);
    setEditOpen(true);
  }

  async function handleSaveDepartment() {
    if (!editingDeptId || !editDeptName.trim())
      return toast.error("Enter department name");
    setEditingDeptSaving(true);
    try {
      await editDepartment.mutateAsync({
        id: editingDeptId,
        name: editDeptName.trim(),
      });
      toast.success("Department updated");
      setEditOpen(false);
      setEditingDeptId(null);
      setEditDeptName("");
    } catch {
      toast.error("Failed to update department");
    } finally {
      setEditingDeptSaving(false);
    }
  }

  function openDeleteDepartment(id: string) {
    setDeletingDeptId(id);
    setDeleteOpen(true);
  }

  async function handleDeleteDepartment() {
    if (!deletingDeptId) return;
    setDeletingDeptSaving(true);
    try {
      await deleteDepartment.mutateAsync(deletingDeptId);
      toast.success("Department deleted");
      setDeleteOpen(false);
      setDeletingDeptId(null);
    } catch {
      toast.error("Failed to delete department");
    } finally {
      setDeletingDeptSaving(false);
    }
  }

  async function handleMoveStaff(staffId: string, value: string) {
    try {
      if (value === "none") {
        await removeStaff.mutateAsync({ staffId });
        toast.success("Removed from department");
      } else {
        await moveStaff.mutateAsync({ staffId, departmentId: value });
        toast.success("Staff moved");
      }
    } catch {
      toast.error("Failed to update staff");
    }
  }

  async function handleRemoveFromDepartment(staffId: string) {
    setDeletingStaffId(staffId);
    try {
      await removeStaff.mutateAsync({ staffId });
      toast.success("Removed from department");
    } catch {
      toast.error("Failed to remove staff");
    } finally {
      setDeletingStaffId(null);
    }
  }

  async function handlePromote(staffId: string) {
    try {
      await promoteStaff.mutateAsync({ staffId });
      toast.success("Promoted to Assistant Admin");
    } catch {
      toast.error("Failed to promote");
    }
  }

  async function handleDemote(staffId: string) {
    try {
      await demoteStaff.mutateAsync({ staffId });
      toast.success("Demoted to Staff");
    } catch {
      toast.error("Failed to demote");
    }
  }

  return (
    <div className="space-y-8">
      {canAdmin && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Management
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="New department name"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="sm:max-w-sm"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleCreateDepartment}
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? "Creating..." : "Create Department"}
                </Button>
                <Link href={`/dashboard/admin/invite`} className="w-full">
                  <Button variant="outline" className="w-full">
                    Invite Staff
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Departments</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDepts ? (
            <div className="text-sm text-muted-foreground">
              Loading departments...
            </div>
          ) : (departments?.length ?? 0) === 0 ? (
            <div className="text-sm text-muted-foreground">
              No departments yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments?.map((dept) => (
                <Card key={dept.id} className="border-blue-100">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold">
                      {dept.name}
                    </CardTitle>
                    {canAdmin && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDepartment(dept.id, dept.name)}
                        >
                          Rename
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDepartment(dept.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs text-muted-foreground">
                      Staff: {dept.staff?.length ?? 0}
                    </div>
                    <ul className="space-y-2">
                      {(dept.staff?.length ?? 0) === 0 && (
                        <li className="text-xs text-muted-foreground">
                          No staff in this department.
                        </li>
                      )}
                      {dept.staff?.map((s: Staff) => (
                        <li
                          key={s.id}
                          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="text-sm">
                            {s.user.fullName || s.user.email}
                          </div>
                          {canAdmin && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full sm:w-auto">
                              <Select
                                value={s.departmentId ?? "none"}
                                onValueChange={(v) => handleMoveStaff(s.id, v)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments?.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                      {d.name}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="none">
                                    No department
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveFromDepartment(s.id)}
                                disabled={deletingStaffId === s.id}
                              >
                                {deletingStaffId === s.id
                                  ? "Removing..."
                                  : "Remove"}
                              </Button>
                              {s.user.role === "SUB_ADMIN" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDemote(s.id)}
                                >
                                  Demote
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePromote(s.id)}
                                >
                                  Promote
                                </Button>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Staff without Department
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStaff ? (
            <div className="text-sm text-muted-foreground">
              Loading staff...
            </div>
          ) : (staff?.filter((s) => !s.departmentId).length ?? 0) === 0 ? (
            <div className="text-sm text-muted-foreground">
              All staff are assigned.
            </div>
          ) : (
            <ul className="space-y-2">
              {staff
                ?.filter((s) => !s.departmentId)
                .map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="text-sm">
                      {s.user.fullName || s.user.email}
                    </div>
                    {canAdmin && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full sm:w-auto">
                        <Select
                          value="none"
                          onValueChange={(v) => handleMoveStaff(s.id, v)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Assign to department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments?.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="none">No department</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePromote(s.id)}
                        >
                          Promote
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => !editingDeptSaving && setEditOpen(o)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Department</DialogTitle>
          </DialogHeader>
          <Input
            value={editDeptName}
            onChange={(e) => setEditDeptName(e.target.value)}
            placeholder="Department name"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={editingDeptSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveDepartment} disabled={editingDeptSaving}>
              {editingDeptSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => !deletingDeptSaving && setDeleteOpen(o)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this department?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deletingDeptSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDepartment}
              disabled={deletingDeptSaving}
            >
              {deletingDeptSaving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
