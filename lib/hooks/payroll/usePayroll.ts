"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  PayrollBatchWithItemsSchema,
  PayrollItemSchema,
  type PayrollBatchWithItems,
} from "@/lib/types/payroll";

export function usePayrollBatch(batchId: string) {
  const queryClient = useQueryClient();

  const getBatch = () =>
    useQuery({
      queryKey: ["payroll-batch", batchId],
      queryFn: async () => {
        const res = await axios.get(`/api/payroll/batch/${batchId}`);
        return PayrollBatchWithItemsSchema.parse(
          res.data
        ) as PayrollBatchWithItems;
      },
      enabled: !!batchId,
    });

  const updateItem = useMutation({
    mutationFn: async ({
      itemId,
      body,
    }: {
      itemId: string;
      body: { amount?: number; paid?: boolean };
    }) => {
      const res = await axios.put(
        `/api/payroll/batch/${batchId}/item/${itemId}`,
        body
      );
      return PayrollItemSchema.parse(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-batch", batchId] });
    },
  });

  return { getBatch, updateItem };
}
