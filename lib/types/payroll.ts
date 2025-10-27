import { z } from "zod";
import { StaffSchema } from "./staff";

export const PayrollSchema = z.object({
  id: z.string(),
  staffId: z.string(),
  businessId: z.string(),
  amount: z.number(),
  period: z.string(),
  paid: z.boolean(),
  staff: StaffSchema.optional(),
  business: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
});

export type Payroll = z.infer<typeof PayrollSchema>;
