export interface User {
  id: string;
  email: string;
  avatarUrl?: string | null;
  role: "ADMIN" | "STAFF";
  fullName?: string | null;
  businessId?: string | null;
  businessName?: string | null;
}
