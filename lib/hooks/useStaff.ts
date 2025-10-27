import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";

export function useStaff() {
  const query = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data } = await axios.get("/api/staff");
      return data.staff;
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const promoteStaff = useMutation({
    mutationFn: async ({ staffId }: { staffId: string }) => {
      await axios.post("/api/staff/promote", { staffId, role: "SUB_ADMIN" });
    },
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
  });

  const removeStaff = useMutation({
    mutationFn: async ({ staffId }: { staffId: string }) => {
      await axios.post("/api/staff/remove", { staffId });
    },
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
