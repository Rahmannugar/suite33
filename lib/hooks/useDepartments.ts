import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";

export function useDepartments() {
  const query = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await axios.get("/api/departments");
      return data.departments;
    },
  });

  const deleteDepartment = useMutation({
    mutationFn: async (departmentId: string) => {
      await axios.delete(`/api/departments/${departmentId}`);
    },
  });

  return {
    departments: query.data,
    isLoading: query.isLoading,
    deleteDepartment,
    refetch: query.refetch,
  };
}
