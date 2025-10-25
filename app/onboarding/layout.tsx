import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { PrismaClient } from "@/lib/generated/prisma";

export default async function OnboardingLayout({
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

  // If admin and onboarding complete, redirect to dashboard
  if (profile?.role === "ADMIN" && profile.business?.id && profile.fullName) {
    redirect("/dashboard/admin");
  }
  // If staff/subadmin and onboarding complete, redirect to dashboard
  if (
    (profile?.role === "STAFF" || profile?.role === "SUB_ADMIN") &&
    profile.fullName
  ) {
    redirect("/dashboard/staff");
  }

  return <>{children}</>;
}
