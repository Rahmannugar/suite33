import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PayrollBatch,
  PayrollBatchItem,
  PayrollSelfView,
} from "@/lib/types/payroll";
import axios from "axios";

export function usePayroll() {
  const qc = useQueryClient();

  function getBatches() {
    return useQuery({
      queryKey: ["payroll", "batches"],
      queryFn: async () => {
        const res = await axios.get("/api/payroll/batch");
        return res.data as
          | PayrollBatch[]
          | { id: string; period: string; locked: boolean }[];
      },
    });
  }

  function getBatch(id: string) {
    return useQuery({
      queryKey: ["payroll", "batch", id],
      queryFn: async () => {
        const res = await axios.get(`/api/payroll/batch/${id}`);
        return res.data as PayrollBatch | PayrollSelfView;
      },
      enabled: Boolean(id),
    });
  }

  const createBatch = useMutation({
    mutationFn: async (payload: { period: string }) => {
      const res = await axios.post("/api/payroll/batch", payload);
      return res.data as PayrollBatch;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll", "batches"] });
    },
  });

  const updateBatch = useMutation({
    mutationFn: async (payload: { id: string; locked: boolean }) => {
      const res = await axios.put(`/api/payroll/batch/${payload.id}`, {
        locked: payload.locked,
      });
      return res.data as PayrollBatch;
    },
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: ["payroll", "batch", payload.id] });
      qc.invalidateQueries({ queryKey: ["payroll", "batches"] });
    },
  });

  const deleteBatch = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/payroll/batch/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll", "batches"] });
    },
  });

  const updateItem = useMutation({
    mutationFn: async (payload: {
      batchId: string;
      itemId: string;
      amount: number;
      paid: boolean;
    }) => {
      const res = await axios.put(
        `/api/payroll/batch/${payload.batchId}/item/${payload.itemId}`,
        { amount: payload.amount, paid: payload.paid }
      );
      return res.data as PayrollBatchItem;
    },
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: ["payroll", "batch", payload.batchId] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (payload: { batchId: string; itemId: string }) => {
      const res = await axios.delete(
        `/api/payroll/batch/${payload.batchId}/item/${payload.itemId}`
      );
      return res.data;
    },
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: ["payroll", "batch", payload.batchId] });
    },
  });

  return {
    getBatches,
    getBatch,
    createBatch,
    updateBatch,
    deleteBatch,
    updateItem,
    deleteItem,
  };
}
