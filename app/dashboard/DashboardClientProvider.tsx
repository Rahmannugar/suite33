"use client";

import { useProfile } from "@/lib/hooks/useProfile";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { ReactNode } from "react";
import { useSidebarStore } from "@/lib/stores/sidebarStore";

export default function DashboardClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  useProfile();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 relative">
        <Header />
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}

function MainContent({ children }: { children: ReactNode }) {
  const collapsed = useSidebarStore((state) => state.collapsed);

  return (
    <main
      className={`pt-24 pb-10 transition-all px-6 sm:px-8 ${
        collapsed ? "md:pl-28" : "md:pl-72"
      } 2xl:flex 2xl:justify-center`}
    >
      <div className="w-full max-w-[1400px]">{children}</div>
    </main>
  );
}
