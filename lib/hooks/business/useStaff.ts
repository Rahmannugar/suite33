import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { StaffSchema } from "@/lib/types/staff";
import z from "zod";

export function useStaff(opts?: {
  page?: number;
  perPage?: number;
  search?: string;
  departmentId?: string;
}) {
  const queryClient = useQueryClient();

  const { page = 1, perPage = 10, search = "", departmentId = "" } = opts || {};

  const query = useQuery({
    queryKey: ["staff", page, perPage, search, departmentId],
    queryFn: async () => {
      const { data } = await axios.get("/api/staff", {
        params: { page, perPage, search, departmentId },
      });

      const parsed = z.array(StaffSchema).safeParse(data.staff);
      if (!parsed.success) throw new Error("Invalid staff data");

      return { staff: parsed.data, pagination: data.pagination };
    },
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["staff"] }),
      queryClient.invalidateQueries({ queryKey: ["departments"] }),
    ]);
  };

  const promoteStaff = useMutation({
    mutationFn: async ({ staffId }: { staffId: string }) =>
      axios.post("/api/staff/promote", { staffId, role: "SUB_ADMIN" }),
    onSuccess: invalidateAll,
  });

  const demoteStaff = useMutation({
    mutationFn: async ({ staffId }: { staffId: string }) =>
      axios.post("/api/staff/promote", { staffId, role: "STAFF" }),
    onSuccess: invalidateAll,
  });

  const moveStaff = useMutation({
    mutationFn: async ({
      staffId,
      departmentId,
    }: {
      staffId: string;
      departmentId: string;
    }) => axios.post("/api/staff/move", { staffId, departmentId }),
    onSuccess: invalidateAll,
  });

  const removeStaff = useMutation({
    mutationFn: async ({ staffId }: { staffId: string }) =>
      axios.post("/api/staff/remove", { staffId }),
    onSuccess: invalidateAll,
  });

  const deleteStaff = useMutation({
    mutationFn: async ({ staffId }: { staffId: string }) =>
      axios.post("/api/staff/delete", { staffId }),
    onSuccess: invalidateAll,
  });

  return {
    staff: query.data?.staff || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,

    promoteStaff,
    demoteStaff,
    moveStaff,
    removeStaff,
    deleteStaff,
  };
}
