import { z } from "zod";

export const InventorySchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  categoryId: z.string(),
  businessId: z.string(),
  category: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Inventory = z.infer<typeof InventorySchema>;
