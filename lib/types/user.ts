export type User = {
  id: string;
  email: string;
  role: "ADMIN" | "STAFF";
  businessId?: string;
} | null;
