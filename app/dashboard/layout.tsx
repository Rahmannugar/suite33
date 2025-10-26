import type { ReactNode } from "react";
import DashboardClientProvider from "./DashboardClientProvider";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { PrismaClient } from "@/lib/generated/prisma";

export const generateMetadata = () => ({
  title: "Dashboard",
  description: "Suite33 Business Management Dashboard",
});

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/auth/login");
  }

  const prisma = new PrismaClient();
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    include: { business: true },
  });

  if (
    profile?.role === "ADMIN" &&
    (!profile.business?.id || !profile.fullName)
  ) {
    redirect("/onboarding/admin");
  }
  if (
    (profile?.role === "STAFF" || profile?.role === "SUB_ADMIN") &&
    !profile.fullName
  ) {
    redirect("/onboarding/staff");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-4 sm:p-8">
          <DashboardClientProvider>{children}</DashboardClientProvider>
        </main>
      </div>
    </div>
  );
}
