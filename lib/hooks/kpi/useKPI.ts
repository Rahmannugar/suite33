import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";
import { StaffKPISchema, DepartmentKPISchema } from "@/lib/types/kpi";

export function useKPI(page = 1, perPage = 10) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["kpis", page, perPage],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/kpis?page=${page}&perPage=${perPage}`
      );

      const staffResult = z
        .array(StaffKPISchema)
        .safeParse(data.kpis?.staff || []);
      const deptResult = z
        .array(DepartmentKPISchema)
        .safeParse(data.kpis?.department || []);
      const myStaffResult = z
        .array(StaffKPISchema)
        .safeParse(data.myKPIs?.staff || []);
      const myDeptResult = z
        .array(DepartmentKPISchema)
        .safeParse(data.myKPIs?.department || []);

      if (
        !staffResult.success ||
        !deptResult.success ||
        !myStaffResult.success ||
        !myDeptResult.success
      ) {
        throw new Error("Invalid KPI data");
      }

      return {
        staffKPIs: staffResult.data,
        departmentKPIs: deptResult.data,
        myStaffKPIs: myStaffResult.data,
        myDeptKPIs: myDeptResult.data,
        pagination: data.pagination,
      };
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const addKPI = useMutation({
    mutationFn: async (payload: {
      scope: "STAFF" | "DEPARTMENT";
      scopeId: string;
      metric: string;
      description?: string;
      metricType?: string;
      status?: string;
      target?: number;
      period: Date;
      notes?: string;
    }) => {
      await axios.post("/api/kpis", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
    },
  });

  const editKPI = useMutation({
    mutationFn: async (payload: {
      id: string;
      scope: "STAFF" | "DEPARTMENT";
      metric: string;
      description?: string;
      metricType?: string;
      status?: string;
      target?: number;
      period?: Date;
      notes?: string;
    }) => {
      await axios.put(`/api/kpis/${payload.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
    },
  });

  const deleteKPI = useMutation({
    mutationFn: async (payload: {
      id: string;
      scope: "STAFF" | "DEPARTMENT";
    }) => {
      await axios.delete(`/api/kpis/${payload.id}?scope=${payload.scope}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
    },
  });

  const getInsight = useMutation({
    mutationFn: async (payload: {
      scope: "STAFF" | "DEPARTMENT" | "BUSINESS";
      scopeId?: string;
      period: Date;
    }) => {
      const { data } = await axios.post("/api/kpis/insights", payload);
      return data.insight;
    },
  });

  return {
    staffKPIs: query.data?.staffKPIs || [],
    departmentKPIs: query.data?.departmentKPIs || [],
    myStaffKPIs: query.data?.myStaffKPIs || [],
    myDeptKPIs: query.data?.myDeptKPIs || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    addKPI,
    editKPI,
    deleteKPI,
    getInsight,
  };
}
