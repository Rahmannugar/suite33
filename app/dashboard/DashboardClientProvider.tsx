"use client";

import { useProfile } from "@/lib/hooks/useProfile";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { useSidebarStore } from "@/lib/stores/sidebarStore";
import { ReactNode } from "react";

export default function DashboardClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  useProfile();
  const { collapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="relative">
        <Header />
        <main
          className={`pt-4 sm:pt-8 transition-all ${
            collapsed ? "md:pl-20" : "md:pl-64"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}