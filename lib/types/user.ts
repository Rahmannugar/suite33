import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  email: z.email(),
  avatarUrl: z.url().nullable().optional(),
  role: z.enum(["ADMIN", "STAFF", "SUB_ADMIN"]),
  fullName: z.string().nullable().optional(),
  businessId: z.string().nullable().optional(),
  businessLogo: z.url().nullable().optional(),
  businessName: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  departmentName: z.string().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;
