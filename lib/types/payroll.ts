import { z } from "zod";

export const PayrollSchema = z.object({
  id: z.string(),
  staffId: z.string(),
  businessId: z.string(),
  amount: z.number(),
  period: z.string(),
  paid: z.boolean(),
  staff: z
    .object({
      id: z.string(),
      user: z.object({
        id: z.string(),
        fullName: z.string().nullable().optional(),
        email: z.string(),
      }),
      department: z
        .object({
          id: z.string(),
          name: z.string(),
        })
        .nullable()
        .optional(),
    })
    .optional(),
});

export type Payroll = z.infer<typeof PayrollSchema>;
