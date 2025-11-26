import { z } from "zod";

export const PayrollBatchItemSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  staffId: z.string(),
  amount: z.number(),
  paid: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),

  staff: z
    .object({
      id: z.string(),
      user: z.object({
        id: z.string(),
        fullName: z.string().nullable(),
        email: z.string(),
      }),
    })
    .optional(),
});

export type PayrollBatchItem = z.infer<typeof PayrollBatchItemSchema>;

export const PayrollBatchSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  period: z.string(),
  locked: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),

  items: z.array(PayrollBatchItemSchema).optional(),
});

export type PayrollBatch = z.infer<typeof PayrollBatchSchema>;

export const PayrollSelfViewSchema = z.object({
  id: z.string(),
  period: z.string(),
  locked: z.boolean(),
  item: PayrollBatchItemSchema.nullable(),
});

export type PayrollSelfView = z.infer<typeof PayrollSelfViewSchema>;

export type ExportablePayroll = {
  Name: string;
  Email: string;
  Amount: string;
  Paid: string;
};
