import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { StaffSchema } from "../types/staff";
import z from "zod";

export function useStaff() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data } = await axios.get("/api/staff");
      const result = z.array(StaffSchema).safeParse(data.staff);
      if (!result.success) throw new Error("Invalid staff data");
      return result.data;
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["staff"] }),
      queryClient.invalidateQueries({ queryKey: ["departments"] }),
    ]);
  };

  const promoteStaff = useMutation({
    mutationFn: async ({ staffId }: { staffId: string }) => {
      await axios.post("/api/staff/promote", { staffId, role: "SUB_ADMIN" });
    },
    onSuccess: invalidateAll,
  });

  const demoteStaff = useMutation({
    mutationFn: async ({ staffId }: { staffId: string }) => {
      await axios.post("/api/staff/promote", { staffId, role: "STAFF" });
    },
    onSuccess: invalidateAll,
  });

  const moveStaff = useMutation({
    mutationFn: async ({
      staffId,
      departmentId,
    }: {
      staffId: string;
      departmentId: string;
    }) => {
      await axios.post("/api/staff/move", { staffId, departmentId });
    },
    onSuccess: invalidateAll,
  });

  const removeStaff = useMutation({
    mutationFn: async ({ staffId }: { staffId: string }) => {
      await axios.post("/api/staff/remove", { staffId });
    },
    onSuccess: invalidateAll,
  });

  const deleteStaff = useMutation({
    mutationFn: async ({
      staffId,
      userId,
    }: {
      staffId: string;
      userId: string;
    }) => {
      await axios.post("/api/staff/delete", { staffId, userId });
    },
    onSuccess: invalidateAll,
  });

  return {
    staff: query.data,
    isLoading: query.isLoading,
    promoteStaff,
    demoteStaff,
    moveStaff,
    removeStaff,
    deleteStaff,
  };
}
