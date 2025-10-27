import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import z from "zod";
import { DepartmentSchema } from "../types/department";

export function useDepartments() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await axios.get("/api/departments");
      const result = z.array(DepartmentSchema).safeParse(data.departments);
      if (!result.success) throw new Error("Invalid departments data");
      return result.data;
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const deleteDepartment = useMutation({
    mutationFn: async (departmentId: string) => {
      await axios.delete(`/api/departments/${departmentId}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });

  return {
    departments: query.data,
    isLoading: query.isLoading,
    deleteDepartment,
    refetch: query.refetch,
  };
}
