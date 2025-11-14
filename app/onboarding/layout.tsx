import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { prisma } from "@/prisma/config";

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

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    include: { business: true, Staff: { include: { business: true } } },
  });

  if (profile?.deletedAt) {
    redirect("/unathorized");
  }

  const business = profile?.business || profile?.Staff?.business;
  if (business?.deletedAt) {
    redirect("/unathorized");
  }

  if (profile?.role === "ADMIN" && profile.business?.id && profile.fullName) {
    redirect("/dashboard/admin");
  }

  if (
    (profile?.role === "STAFF" || profile?.role === "SUB_ADMIN") &&
    profile.fullName
  ) {
    redirect("/dashboard/staff");
  }

  return <>{children}</>;
}
