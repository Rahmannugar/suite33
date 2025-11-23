"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { StaffKPISchema, DepartmentKPISchema } from "@/lib/types/kpi";
import { z } from "zod";

export function useKPI() {
  const queryClient = useQueryClient();

  function getStaffKPIs(params: any) {
    const query = useQuery({
      queryKey: ["kpi-staff", params],
      queryFn: async () => {
        const { data } = await axios.get("/api/kpi/staff", { params });
        const list = z.array(StaffKPISchema).safeParse(data.data);
        if (!list.success) throw new Error("Invalid KPI data");
        return {
          data: list.data,
          total: data.total,
          page: data.page,
          perPage: data.perPage,
        };
      },
      enabled: !!params,
    });
    return query;
  }

  function getDepartmentKPIs(params: any) {
    const query = useQuery({
      queryKey: ["kpi-dept", params],
      queryFn: async () => {
        const { data } = await axios.get("/api/kpi/department", { params });
        const list = z.array(DepartmentKPISchema).safeParse(data.data);
        if (!list.success) throw new Error("Invalid KPI data");
        return {
          data: list.data,
          total: data.total,
          page: data.page,
          perPage: data.perPage,
        };
      },
      enabled: !!params,
    });
    return query;
  }

  const createStaffKPI = useMutation({
    mutationFn: async (body: any) => {
      await axios.post("/api/kpi/staff", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-staff"] });
    },
  });

  const updateStaffKPI = useMutation({
    mutationFn: async (body: any) => {
      await axios.put("/api/kpi/staff", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-staff"] });
    },
  });

  const deleteStaffKPI = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete("/api/kpi/staff", { params: { id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-staff"] });
    },
  });

  const createDeptKPI = useMutation({
    mutationFn: async (body: any) => {
      await axios.post("/api/kpi/department", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-dept"] });
    },
  });

  const updateDeptKPI = useMutation({
    mutationFn: async (body: any) => {
      await axios.put("/api/kpi/department", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-dept"] });
    },
  });

  const deleteDeptKPI = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete("/api/kpi/department", { params: { id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-dept"] });
    },
  });

  const generateInsights = useMutation({
    mutationFn: async ({ year, month }: { year: number; month?: number }) => {
      const { data } = await axios.post("/api/kpi/insights", { year, month });
      return data.insight;
    },
  });

  return {
    getStaffKPIs,
    getDepartmentKPIs,
    createStaffKPI,
    updateStaffKPI,
    deleteStaffKPI,
    createDeptKPI,
    updateDeptKPI,
    deleteDeptKPI,
    generateInsights,
  };
}
