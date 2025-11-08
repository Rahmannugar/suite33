import { z } from "zod";

export const ExpenditureSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  description: z.string(),
  amount: z.number(),
  date: z.string(),
});

export type Expenditure = z.infer<typeof ExpenditureSchema>;
