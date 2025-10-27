import { z } from "zod";

export const ExpenditureSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  amount: z.number(),
  description: z.string().nullable().optional(),
  date: z.string(),
});

export type Expenditure = z.infer<typeof ExpenditureSchema>;
