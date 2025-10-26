"use client"

import { useDepartments } from "@/lib/hooks/useDepartments";
import { useStaff } from "@/lib/hooks/useStaff";
import { useAuthStore } from "@/lib/stores/authStore";
import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";

export default function DepartmentManager() {
  const {
    departments,
    isLoading: loadingDepts,
    deleteDepartment,
    refetch: refetchDepts,
  } = useDepartments();
  const {
    staff,
    isLoading: loadingStaff,
    promoteStaff,
    demoteStaff,
    moveStaff,
    removeStaff,
    refetch: refetchStaff,
  } = useStaff();
  const user = useAuthStore((s) => s.user);

  const [newDeptName, setNewDeptName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);

  async function handleCreateDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    if (!user?.businessId) return;

    setCreating(true);
    try {
      await axios.post("/api/departments/create", {
        name: newDeptName,
        businessId: user.businessId,
      });
      toast.success("Department created!");
      setNewDeptName("");
      refetchDepts();
    } catch {
      toast.error("Failed to create department");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteStaff(staffId: string, userId: string) {
    setDeletingStaffId(staffId);
    try {
      await axios.post("/api/staff/delete", { staffId, userId });
      toast.success("Staff fully deleted!");
      refetchStaff();
    } catch {
      toast.error("Failed to delete staff");
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
        </form>
      )}

      {/* Departments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loadingDepts ? (
          <div>Loading departments...</div>
        ) : departments?.length ? (
          departments.map((dept: any) => (
            <div key={dept.id} className="border rounded-lg p-4">
              <div className="font-semibold mb-2">{dept.name}</div>
              <div className="mb-2 text-xs text-gray-500">
                Staff: {dept.staff.length}
              </div>
              {user?.role === "ADMIN" && (
                <button
                  className="text-red-600 text-xs mb-2"
                  onClick={() => {
                    deleteDepartment.mutate(dept.id, {
                      onSuccess: () => {
                        toast.success("Department deleted!");
                        refetchDepts();
                        refetchStaff();
                      },
                      onError: () => toast.error("Failed to delete department"),
                    });
                  }}
                >
                  Delete Department
                </button>
              )}
              <ul className="space-y-1">
                {dept.staff.length === 0 && (
                  <li className="text-xs text-[--muted-foreground]">
                    No staff in this department.
                  </li>
                )}
                {dept.staff.map((s: any) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <span>{s.user.fullName || s.user.email}</span>
                    {user?.role === "ADMIN" && (
                      <>
                        {/* Move Staff */}
                        <select
                          value={s.departmentId ?? dept.id}
                          onChange={async (e) => {
                            const newDeptId = e.target.value;
                            await moveStaff.mutateAsync(
                              { staffId: s.id, departmentId: newDeptId },
                              { onSuccess: () => refetchStaff() }
                            );
                            toast.success("Staff moved!");
                          }}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          {departments?.map((d: any) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                          <option value="">No department</option>
                        </select>
                        {/* Remove Staff from Department */}
                        <button
                          className="text-red-600 text-xs"
                          onClick={async () => {
                            await removeStaff.mutate(
                              { staffId: s.id },
                              { onSuccess: () => refetchStaff() }
                            );
                            toast.success("Staff removed from department!");
                          }}
                        >
                          Remove
                        </button>
                        {/* Demote Assistant Admin */}
                        {s.user.role === "SUB_ADMIN" && (
                          <button
                            className="text-yellow-600 text-xs"
                            onClick={async () => {
                              await demoteStaff.mutate(
                                { staffId: s.id },
                                { onSuccess: () => refetchStaff() }
                              );
                              toast.success("Demoted to Staff!");
                            }}
                          >
                            Demote to Staff
                          </button>
                        )}
                        <button
                          className="text-red-700 text-xs"
                          onClick={() => handleDeleteStaff(s.id, s.user.id)}
                          disabled={deletingStaffId === s.id}
                        >
                          {deletingStaffId === s.id
                            ? "Deleting..."
                            : "Delete from Business"}
                        </button>
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
      {/* Staff not in any department */}
      <div>
        <h2 className="font-semibold mb-2">Staff without Department</h2>
        <ul className="space-y-1">
          {loadingStaff ? (
            <div>Loading staff...</div>
          ) : staff?.filter((s: any) => !s.departmentId).length === 0 ? (
            <li className="text-xs text-[--muted-foreground]">
              All staff are assigned to departments.
            </li>
          ) : (
            staff
              ?.filter((s: any) => !s.departmentId)
              .map((s: any) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span>{s.user.fullName || s.user.email}</span>
                  {user?.role === "ADMIN" && (
                    <>
                      {/* Move to department */}
                      <select
                        value=""
                        onChange={async (e) => {
                          const newDeptId = e.target.value;
                          await moveStaff.mutateAsync(
                            { staffId: s.id, departmentId: newDeptId },
                            { onSuccess: () => refetchStaff() }
                          );
                          toast.success("Staff moved to department!");
                        }}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="">Assign to department</option>
                        {departments?.map((d: any) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      {/* Promote to Assistant Admin */}
                      <button
                        className="text-blue-600 text-xs"
                        onClick={() =>
                          promoteStaff.mutate(
                            { staffId: s.id },
                            { onSuccess: () => refetchStaff() }
                          )
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
