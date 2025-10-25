export interface User {
  id: string;
  email: string;
  avatarUrl?: string | null;
  role: "ADMIN" | "STAFF" | "SUB_ADMIN";
  fullName?: string | null;
  businessId?: string | null;
  businessName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
}
