"use client";

import type { Department } from "@/lib/types/department";
import type { Staff } from "@/lib/types/staff";
import { useDepartments } from "@/lib/hooks/useDepartments";
import { useStaff } from "@/lib/hooks/useStaff";
import { useAuthStore } from "@/lib/stores/authStore";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

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
  const user = useAuthStore((state) => state.user);

  const [newDeptName, setNewDeptName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editingDept, setEditingDept] = useState(false);

  async function handleCreateDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    if (!user?.businessId) return;

    setCreating(true);
    try {
      await createDepartment.mutateAsync({
        name: newDeptName,
        businessId: user.businessId,
      });
      toast.success("Department created!");
      setNewDeptName("");
    } catch {
      toast.error("Failed to create department");
    } finally {
      setCreating(false);
    }
  }

  async function handleEditDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDeptId || !editDeptName.trim()) return;
    setEditingDept(true);
    try {
      await editDepartment.mutateAsync({
        id: editingDeptId,
        name: editDeptName,
      });
      toast.success("Department name updated!");
      setEditingDeptId(null);
      setEditDeptName("");
    } catch {
      toast.error("Failed to update department");
    } finally {
      setEditingDept(false);
    }
  }

  async function handleDeleteStaff(staffId: string, userId: string) {
    setDeletingStaffId(staffId);
    try {
      await removeStaff.mutateAsync({ staffId });
      toast.success("Staff removed from department!");
    } catch {
      toast.error("Failed to remove staff");
    } finally {
      setDeletingStaffId(null);
    }
  }

  return (
    <div className="space-y-8">
      {user?.role === "ADMIN" && (
        <form onSubmit={handleCreateDepartment} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="New department name"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={creating}
          >
            {creating ? "Creating..." : "Create Department"}
          </button>
          <Link href={`/dashboard/admin/invite`}>Invite Staff</Link>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loadingDepts ? (
          <div>Loading departments...</div>
        ) : departments?.length ? (
          departments.map((dept: Department) => (
            <div key={dept.id} className="border rounded-lg p-4">
              <div className="font-semibold mb-2">
                {editingDeptId === dept.id ? (
                  <form onSubmit={handleEditDepartment} className="flex gap-2">
                    <input
                      type="text"
                      value={editDeptName}
                      onChange={(e) => setEditDeptName(e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      disabled={editingDept}
                    >
                      {editingDept ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded bg-gray-100"
                      onClick={() => {
                        setEditingDeptId(null);
                        setEditDeptName("");
                      }}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    {dept.name}
                    {user?.role === "ADMIN" && (
                      <button
                        className="ml-2 text-xs text-blue-600 underline"
                        onClick={() => {
                          setEditingDeptId(dept.id);
                          setEditDeptName(dept.name);
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="mb-2 text-xs text-gray-500">
                Staff: {dept.staff?.length ?? 0}
              </div>
              {user?.role === "ADMIN" && (
                <button
                  className="text-red-600 text-xs mb-2"
                  onClick={() => {
                    deleteDepartment.mutate(dept.id, {
                      onSuccess: () => toast.success("Department deleted!"),
                      onError: () => toast.error("Failed to delete department"),
                    });
                  }}
                >
                  Delete Department
                </button>
              )}

              <ul className="space-y-1">
                {(dept.staff?.length ?? 0) === 0 && (
                  <li className="text-xs text-[--muted-foreground]">
                    No staff in this department.
                  </li>
                )}
                {dept.staff?.map((s: Staff) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <span>{s.user.fullName || s.user.email}</span>
                    {user?.role === "ADMIN" && (
                      <>
                        <select
                          value={s.departmentId ?? dept.id}
                          onChange={async (e) => {
                            const newDeptId = e.target.value;
                            await moveStaff.mutateAsync({
                              staffId: s.id,
                              departmentId: newDeptId,
                            });
                            toast.success("Staff moved!");
                          }}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          {departments?.map((d: Department) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                          <option value="">No department</option>
                        </select>
                        <button
                          className="text-red-600 text-xs"
                          onClick={() => handleDeleteStaff(s.id, s.user.id)}
                          disabled={deletingStaffId === s.id}
                        >
                          {deletingStaffId === s.id ? "Removing..." : "Remove"}
                        </button>
                        {s.user.role === "SUB_ADMIN" && (
                          <button
                            className="text-yellow-600 text-xs"
                            onClick={async () => {
                              await demoteStaff.mutateAsync({ staffId: s.id });
                              toast.success("Demoted to Staff!");
                            }}
                          >
                            Demote to Staff
                          </button>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <div className="text-sm text-[--muted-foreground]">
            No departments yet.
          </div>
        )}
      </div>
      <div>
        <h2 className="font-semibold mb-2">Staff without Department</h2>
        <ul className="space-y-1">
          {loadingStaff ? (
            <div>Loading staff...</div>
          ) : staff?.filter((s: Staff) => !s.departmentId).length === 0 ? (
            <li className="text-xs text-[--muted-foreground]">
              All staff are assigned to departments.
            </li>
          ) : (
            staff
              ?.filter((s: Staff) => !s.departmentId)
              .map((s: Staff) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span>{s.user.fullName || s.user.email}</span>
                  {user?.role === "ADMIN" && (
                    <>
                      <select
                        value=""
                        onChange={async (e) => {
                          const newDeptId = e.target.value;
                          await moveStaff.mutateAsync({
                            staffId: s.id,
                            departmentId: newDeptId,
                          });
                          toast.success("Staff moved to department!");
                        }}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="">Assign to department</option>
                        {departments?.map((d: Department) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      <button
                        className="text-blue-600 text-xs"
                        onClick={() =>
                          promoteStaff.mutateAsync({ staffId: s.id })
                        }
                      >
                        Promote to Assistant Admin
                      </button>
                    </>
                  )}
                </li>
              ))
          )}
        </ul>
      </div>
    </div>
  );
}
