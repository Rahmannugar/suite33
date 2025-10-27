import { z } from "zod";
import { StaffSchema } from "./staff";

export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  businessId: z.string(),
  staff: z.array(StaffSchema).optional().default([]),
});

export type Department = z.infer<typeof DepartmentSchema>;
