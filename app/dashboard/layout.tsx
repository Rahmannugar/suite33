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
