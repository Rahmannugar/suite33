import { z } from "zod";

export const StaffSchema = z.object({
  id: z.string(),
  userId: z.string(),
  businessId: z.string(),
  departmentId: z.string().nullable().optional(),
  user: z.object({
    id: z.string(),
    email: z.email(),
    fullName: z.string().nullable().optional(),
    avatarUrl: z.string().nullable().optional(),
    role: z.enum(["ADMIN", "STAFF", "SUB_ADMIN"]),
  }),
  department: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable()
    .optional(),
});

export type Staff = z.infer<typeof StaffSchema>;
