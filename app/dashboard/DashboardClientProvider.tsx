"use client";

import { useProfile } from "@/lib/hooks/useProfile";
import { ReactNode } from "react";

export default function DashboardClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  useProfile();
  return <>{children}</>;
}
