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
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 bg-[--background] text-[--foreground] p-6 overflow-auto">
          <Header />
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
