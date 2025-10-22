import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { AuthGuard } from "@/lib/providers/AuthGuard";
import { ReactNode } from "react";

export const generateMetadata = () => {
  return {
    title: "Dashboard",
    description: "Suite33 Business Management Dashboard",
  };
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <main>{children}</main>;
}
