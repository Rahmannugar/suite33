import { z } from "zod";

export const PayrollItemSchema = z.object({
  id: z.string(),
  staffId: z.string(),
  amount: z.number(),
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
    .nullable()
    .optional(),
});

export type PayrollItem = z.infer<typeof PayrollItemSchema>;

export const PayrollBatchSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  period: z.string(),
  locked: z.boolean(),
});

export type PayrollBatch = z.infer<typeof PayrollBatchSchema>;

export const PayrollBatchWithItemsSchema = PayrollBatchSchema.extend({
  items: z.array(PayrollItemSchema),
});

export type PayrollBatchWithItems = z.infer<typeof PayrollBatchWithItemsSchema>;
