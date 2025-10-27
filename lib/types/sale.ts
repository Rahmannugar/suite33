import { z } from "zod";

export const SaleSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  amount: z.number(),
  description: z.string().nullable().optional(),
  date: z.string(),
});

export type Sale = z.infer<typeof SaleSchema>;
