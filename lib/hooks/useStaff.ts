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

  const promoteStaff = useMutation({
    mutationFn: async ({ staffId }: { staffId: string }) => {
      await axios.post("/api/staff/promote", { staffId, role: "SUB_ADMIN" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  const demoteStaff = useMutation({
    mutationFn: async ({ staffId }: { staffId: string }) => {
      await axios.post("/api/staff/promote", { staffId, role: "STAFF" });
    },
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  const removeStaff = useMutation({
    mutationFn: async ({ staffId }: { staffId: string }) => {
      await axios.post("/api/staff/remove", { staffId });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  return {
    staff: query.data,
    isLoading: query.isLoading,
    promoteStaff,
    demoteStaff,
    moveStaff,
    removeStaff,
    refetch: query.refetch,
  };
}
