import { z } from "zod";

export const SaleSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  description: z.string().nullable().optional(),
  amount: z.number(),
  date: z.string(),
});

export type Sale = z.infer<typeof SaleSchema>;
