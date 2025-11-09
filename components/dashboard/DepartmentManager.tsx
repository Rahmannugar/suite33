"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/authStore";
import { useDepartments } from "@/lib/hooks/useDepartments";
import { useStaff } from "@/lib/hooks/useStaff";
import type { Department } from "@/lib/types/department";
import type { Staff } from "@/lib/types/staff";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { UserPlus, Trash2, ArrowRightLeft, ChevronRight } from "lucide-react";

export default function DepartmentManager() {
  const user = useAuthStore((s) => s.user);
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
    deleteStaff,
  } = useStaff();

  const canAdmin = user?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [creatingDept, setCreatingDept] = useState(false);
  const [newDept, setNewDept] = useState("");

  const [dialog, setDialog] = useState<{
    type:
      | null
      | "create"
      | "rename"
      | "deleteDept"
      | "move"
      | "removeDept"
      | "removeBiz"
      | "promote"
      | "demote";
    targetId?: string;
    data?: any;
  }>({ type: null });

  const [saving, setSaving] = useState(false);
  const perPage = 10;
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [selectedDept, search]);

  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    if (selectedDept === "all") return departments;
    if (selectedDept === "none") return [];
    return departments.filter((d) => d.id === selectedDept);
  }, [departments, selectedDept]);

  const staffWithoutDept = useMemo(
    () => staff?.filter((s) => !s.departmentId) ?? [],
    [staff]
  );

  const searchFilter = (text: string) => {
    const val = search.trim().toLowerCase();
    return !val ? true : text.toLowerCase().includes(val);
  };

  async function handleConfirm() {
    if (!dialog.type) return;
    setSaving(true);
    try {
      switch (dialog.type) {
        case "create":
          if (!newDept.trim()) return toast.error("Enter department name");
          await createDepartment.mutateAsync({
            name: newDept.trim(),
            businessId: user?.businessId ?? "",
          });
          toast.success("Department created");
          setNewDept("");
          break;
        case "rename":
          await editDepartment.mutateAsync({
            id: dialog.targetId!,
            name: dialog.data?.trim(),
          });
          toast.success("Department renamed");
          break;
        case "deleteDept":
          await deleteDepartment.mutateAsync(dialog.targetId!);
          toast.success("Department deleted");
          break;
        case "move":
          await moveStaff.mutateAsync({
            staffId: dialog.data.staffId,
            departmentId: dialog.data.newDeptId,
          });
          toast.success("Staff moved");
          break;
        case "removeDept":
          await removeStaff.mutateAsync({ staffId: dialog.targetId! });
          toast.success("Removed from department");
          break;
        case "removeBiz":
          await deleteStaff.mutateAsync({
            staffId: dialog.targetId!,
            userId: dialog.data.userId,
          });
          toast.success("Staff removed from business");
          break;
        case "promote":
          await promoteStaff.mutateAsync({ staffId: dialog.targetId! });
          toast.success("Promoted to Assistant Admin");
          break;
        case "demote":
          await demoteStaff.mutateAsync({ staffId: dialog.targetId! });
          toast.success("Demoted to Staff");
          break;
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setSaving(false);
      setDialog({ type: null });
    }
  }

  function StaffRow({ s, depts }: { s: Staff; depts: Department[] }) {
    const name = s.user.fullName || s.user.email;
    const role = s.user.role === "SUB_ADMIN" ? "Assistant Admin" : "Staff";
    return (
      <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b py-2">
        <div className="flex flex-col">
          <span className="font-medium">{name}</span>
          <span className="text-sm text-blue-700">{s.user.email}</span>
          <span className="text-xs text-muted-foreground">{role}</span>
        </div>
        {canAdmin && (
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer hover:bg-blue-50"
              onClick={() =>
                setDialog({
                  type: "move",
                  data: { staffId: s.id, newDeptId: "" },
                })
              }
            >
              <ArrowRightLeft size={14} /> Move
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer hover:bg-blue-50"
              onClick={() => setDialog({ type: "removeDept", targetId: s.id })}
            >
              <Trash2 size={14} /> Remove
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer hover:bg-blue-50"
              onClick={() =>
                setDialog({
                  type: "removeBiz",
                  targetId: s.id,
                  data: { userId: s.user.id },
                })
              }
            >
              Delete
            </Button>
            {s.user.role === "SUB_ADMIN" ? (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer hover:bg-blue-50"
                onClick={() => setDialog({ type: "demote", targetId: s.id })}
              >
                Demote
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer hover:bg-blue-50"
                onClick={() => setDialog({ type: "promote", targetId: s.id })}
              >
                Promote
              </Button>
            )}
          </div>
        )}
      </li>
    );
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
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  className="gap-2 cursor-pointer"
                  onClick={() => setDialog({ type: "create" })}
                >
                  <UserPlus size={16} /> New Department
                </Button>
                <Link href="/dashboard/admin/invite">
                  <Button variant="outline" className="gap-2 cursor-pointer">
                    Invite Staff <ChevronRight size={16} />
                  </Button>
                </Link>
              </div>
              <div className="flex gap-2 w-full">
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name.toUpperCase()}
                      </SelectItem>
                    ))}
                    <SelectItem value="none">No Department</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search staff by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingDepts || loadingStaff ? (
        <div className="text-sm text-muted-foreground">Loading data...</div>
      ) : (
        <>
          {filteredDepartments.map((dept) => {
            const filteredStaff =
              dept.staff?.filter(
                (s) =>
                  searchFilter(s.user.fullName || "") ||
                  searchFilter(s.user.email || "")
              ) ?? [];
            const totalPages = Math.ceil(filteredStaff.length / perPage);
            const paginated = filteredStaff.slice(
              (page - 1) * perPage,
              page * perPage
            );

            return (
              <Card key={dept.id} className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-blue-800">
                    {dept.name.toUpperCase()}
                  </CardTitle>
                  {canAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDialog({
                            type: "rename",
                            targetId: dept.id,
                            data: dept.name,
                          })
                        }
                      >
                        Rename
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setDialog({ type: "deleteDept", targetId: dept.id })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredStaff.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No staff found.
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {paginated.map((s) => (
                        <StaffRow key={s.id} s={s} depts={departments ?? []} />
                      ))}
                    </ul>
                  )}
                  {totalPages > 1 && (
                    <Pagination className="mt-3">
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
                            onClick={() =>
                              setPage((p) => Math.min(totalPages, p + 1))
                            }
                            className="cursor-pointer"
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {(selectedDept === "none" || selectedDept === "all") && (
            <Card className="border-blue-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-blue-800">
                  STAFF WITHOUT DEPARTMENT
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staffWithoutDept.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No unassigned staff.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {staffWithoutDept.map((s) => (
                      <StaffRow key={s.id} s={s} depts={departments ?? []} />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog
        open={!!dialog.type}
        onOpenChange={() => !saving && setDialog({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog.type === "create" && "Create Department"}
              {dialog.type === "rename" && "Rename Department"}
              {dialog.type === "deleteDept" && "Delete Department"}
              {dialog.type === "move" && "Move Staff to Department"}
              {dialog.type === "removeDept" && "Remove from Department"}
              {dialog.type === "removeBiz" && "Remove from Business"}
              {dialog.type === "promote" && "Promote Staff"}
              {dialog.type === "demote" && "Demote Staff"}
            </DialogTitle>
          </DialogHeader>

          {dialog.type === "create" && (
            <Input
              placeholder="Department name"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
            />
          )}

          {dialog.type === "rename" && (
            <Input
              placeholder="New name"
              value={dialog.data ?? ""}
              onChange={(e) =>
                setDialog((d) => ({ ...d, data: e.target.value }))
              }
            />
          )}

          {dialog.type === "move" && (
            <Select
              value={dialog.data?.newDeptId ?? ""}
              onValueChange={(v) =>
                setDialog((d) => ({
                  ...d,
                  data: { ...d.data, newDeptId: v },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {["deleteDept", "removeDept", "removeBiz"].includes(
            dialog.type ?? ""
          ) && (
            <p className="text-sm text-muted-foreground">
              {dialog.type === "deleteDept" &&
                "Are you sure you want to delete this department?"}
              {dialog.type === "removeDept" &&
                "Are you sure you want to remove this staff from their department?"}
              {dialog.type === "removeBiz" &&
                "Are you sure you want to remove this staff from the business? This cannot be undone."}
            </p>
          )}

          {["promote", "demote"].includes(dialog.type ?? "") && (
            <p className="text-sm text-muted-foreground">
              {dialog.type === "promote"
                ? "Promote this staff to Assistant Admin?"
                : "Demote this staff to regular Staff?"}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog({ type: null })}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant={
                ["deleteDept", "removeDept", "removeBiz"].includes(
                  dialog.type ?? ""
                )
                  ? "destructive"
                  : "default"
              }
              onClick={handleConfirm}
              disabled={saving}
            >
              {saving ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
