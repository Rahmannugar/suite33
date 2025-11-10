import { z } from "zod";

export const SettingsSchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  businessId: z.string()
});

export type Settings = z.infer<typeof SettingsSchema>;