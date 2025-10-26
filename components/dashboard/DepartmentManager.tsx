import { useDepartments } from "@/lib/hooks/useDepartments";
import { useStaff } from "@/lib/hooks/useStaff";
import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useAuthStore } from "@/lib/stores/authStore";

export function DepartmentManager() {
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
        ) : (
          departments?.map((dept: any) => (
            <div key={dept.id} className="border rounded-lg p-4">
              <div className="font-semibold mb-2">{dept.name}</div>
              <div className="mb-2 text-xs text-gray-500">
                Staff: {dept.staff.length}
              </div>
              {user?.role === "ADMIN" && (
                <button
                  className="text-red-600 text-xs mb-2"
                  onClick={() => deleteDepartment.mutate(dept.id)}
                >
                  Delete Department
                </button>
              )}
              <ul className="space-y-1">
                {dept.staff.map((s: any) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <span>{s.user.fullName || s.user.email}</span>
                    <span className="text-xs text-gray-500">
                      {s.user.role === "SUB_ADMIN"
                        ? "Assistant Admin"
                        : "Staff"}
                    </span>
                    {user?.role === "ADMIN" && (
                      <>
                        {s.user.role === "STAFF" && (
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
                        )}
                        {s.user.role === "SUB_ADMIN" && (
                          <button
                            className="text-purple-600 text-xs"
                            onClick={() =>
                              demoteStaff.mutate(
                                { staffId: s.id },
                                { onSuccess: () => refetchStaff() }
                              )
                            }
                          >
                            Demote to Staff
                          </button>
                        )}
                        <button
                          className="text-yellow-600 text-xs"
                          onClick={() =>
                            removeStaff.mutate(
                              { staffId: s.id },
                              { onSuccess: () => refetchStaff() }
                            )
                          }
                        >
                          Remove from Department
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
      {/* Staff not in any department */}
      <div>
        <h2 className="font-semibold mb-2">Staff without Department</h2>
        <ul className="space-y-1">
          {loadingStaff ? (
            <div>Loading staff...</div>
          ) : (
            staff
              ?.filter((s: any) => !s.departmentId)
              .map((s: any) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span>{s.user.fullName || s.user.email}</span>
                  {user?.role === "ADMIN" && (
                    <>
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
                      <select
                        className="border rounded px-2 py-1 text-xs"
                        onChange={(e) =>
                          moveStaff.mutate(
                            {
                              staffId: s.id,
                              departmentId: e.target.value,
                            },
                            { onSuccess: () => refetchStaff() }
                          )
                        }
                      >
                        <option value="">Move to department...</option>
                        {departments?.map((dept: any) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
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
