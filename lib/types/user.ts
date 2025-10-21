export type User = {
  id: string;
  email: string;
  role: "ADMIN" | "STAFF";
} | null;
