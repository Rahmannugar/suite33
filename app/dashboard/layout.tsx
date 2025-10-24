import type { ReactNode } from "react";
import DashboardClientProvider from "./DashboardClientProvider";

export const generateMetadata = () => ({
  title: "Dashboard",
  description: "Suite33 Business Management Dashboard",
});

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main>
      <DashboardClientProvider>{children}</DashboardClientProvider>
    </main>
  );
}
