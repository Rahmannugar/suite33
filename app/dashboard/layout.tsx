import type { ReactNode } from "react";
import DashboardClientProvider from "./DashboardClientProvider";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { prisma } from "@/prisma/config";

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
  return <DashboardClientProvider>{children}</DashboardClientProvider>;
}
