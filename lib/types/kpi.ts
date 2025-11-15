import { z } from "zod";

export const KPIStatus = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "EXPIRED",
]);

export const StaffKPISchema = z.object({
  id: z.string(),
  staffId: z.string(),
  metric: z.string(),
  description: z.string().nullable().optional(),
  metricType: z.string().default("number"),
  status: KPIStatus.default("PENDING"),
  target: z.number().nullable().optional(),
  period: z.string(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
  staff: z
    .object({
      id: z.string(),
      user: z.object({
        id: z.string(),
        email: z.string(),
        fullName: z.string().nullable().optional(),
      }),
    })
    .optional(),
});

export const DepartmentKPISchema = z.object({
  id: z.string(),
  departmentId: z.string(),
  businessId: z.string(),
  metric: z.string(),
  description: z.string().nullable().optional(),
  metricType: z.string().default("number"),
  status: KPIStatus.default("PENDING"),
  target: z.number().nullable().optional(),
  period: z.string(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
  department: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
});

export type StaffKPI = z.infer<typeof StaffKPISchema>;
export type DepartmentKPI = z.infer<typeof DepartmentKPISchema>;
export type KPIStatusType = z.infer<typeof KPIStatus>;
