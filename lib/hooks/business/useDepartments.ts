import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import z from "zod";
import { DepartmentSchema } from "@/lib/types/department";

export function useDepartments(opts?: {
  page?: number;
  perPage?: number;
  search?: string;
}) {
  const queryClient = useQueryClient();

  const { page = 1, perPage = 10, search = "" } = opts || {};

  const query = useQuery({
    queryKey: ["departments", page, perPage, search],
    queryFn: async () => {
      const { data } = await axios.get("/api/departments", {
        params: { page, perPage, search },
      });

      const parsed = z.array(DepartmentSchema).safeParse(data.departments);
      if (!parsed.success) throw new Error("Invalid departments data");

      return { departments: parsed.data, pagination: data.pagination };
    },
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["departments"] }),
      queryClient.invalidateQueries({ queryKey: ["staff"] }),
    ]);
  };

  const createDepartment = useMutation({
    mutationFn: async (payload: { name: string }) =>
      axios.post("/api/departments", payload),
    onSuccess: invalidateAll,
  });

  const editDepartment = useMutation({
    mutationFn: async (payload: { id: string; name: string }) =>
      axios.put(`/api/departments/${payload.id}`, { name: payload.name }),
    onSuccess: invalidateAll,
  });

  const deleteDepartment = useMutation({
    mutationFn: async (id: string) => axios.delete(`/api/departments/${id}`),
    onSuccess: invalidateAll,
  });

  return {
    departments: query.data?.departments || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,

    createDepartment,
    editDepartment,
    deleteDepartment,
  };
}
