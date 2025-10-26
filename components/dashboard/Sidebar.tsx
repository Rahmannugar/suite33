"use client";

import {
  Home,
  TrendingUp,
  Wallet,
  Boxes,
  Users2,
  BadgeDollarSign,
  Target,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/lib/stores/sidebarStore";
import { useEffect } from "react";

const adminLinks = [
  { href: "/dashboard/admin", label: "Dashboard", icon: Home },
  { href: "/dashboard/admin/sales", label: "Sales", icon: TrendingUp },
  {
    href: "/dashboard/admin/expenditures",
    label: "Expenditures",
    icon: Wallet,
  },
  { href: "/dashboard/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/dashboard/admin/management", label: "Management", icon: Users2 },
  { href: "/dashboard/admin/payroll", label: "Payroll", icon: BadgeDollarSign },
  { href: "/dashboard/admin/kpi", label: "KPIs", icon: Target },
  { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
];

const subAdminLinks = adminLinks.filter((l) => l.label !== "Settings");
const staffLinks = [
  { href: "/dashboard/staff", label: "Overview", icon: Home },
  { href: "/dashboard/staff/sales", label: "Sales", icon: TrendingUp },
  {
    href: "/dashboard/staff/expenditures",
    label: "Expenditures",
    icon: Wallet,
  },
  { href: "/dashboard/staff/inventory", label: "Inventory", icon: Boxes },
  { href: "/dashboard/staff/department", label: "Department", icon: Users2 },
  { href: "/dashboard/staff/payroll", label: "Payroll", icon: BadgeDollarSign },
  { href: "/dashboard/staff/kpi", label: "KPIs", icon: Target },
];

function getLinksByRole(role) {
  if (role === "ADMIN") return adminLinks;
  if (role === "SUB_ADMIN") return subAdminLinks;
  return staffLinks;
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } =
    useSidebarStore();

  // Hydrate sidebar width for layout padding (client only)
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "5rem" : "16rem"
    );
  }, [collapsed]);

  const links = getLinksByRole(user?.role);

  // Desktop Sidebar
  return (
    <>
      <aside
        className={`hidden md:flex flex-col h-screen fixed top-0 left-0 z-40 transition-all duration-200 shadow-lg border-r border-[--sidebar-border] ${
          collapsed ? "w-20" : "w-64"
        } bg-[--sidebar]`}
        style={{ background: "var(--sidebar, #fff)" }}
      >
        <div className="relative flex items-center h-16 px-4">
          <span
            className={`font-bold text-lg text-blue-700 transition-all duration-200 ${
              collapsed ? "overflow-hidden w-0 opacity-0" : "w-auto opacity-100"
            }`}
            style={{ transition: "width 0.2s, opacity 0.2s" }}
          >
            Suite33
          </span>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-blue-900/60 border border-[--sidebar-border] shadow p-2 rounded-full flex items-center justify-center transition hover:bg-blue-50"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{ zIndex: 50 }}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        <nav className="flex-1 flex flex-col gap-2 py-6 px-2">
          {links.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition font-medium ${
                pathname === href
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700"
                  : "text-[--sidebar-foreground] hover:bg-blue-50 dark:hover:bg-blue-900/40"
              }`}
              style={{ justifyContent: collapsed ? "center" : "flex-start" }}
            >
              <Icon size={22} />
              {!collapsed && <span className="truncate">{label}</span>}
            </a>
          ))}
        </nav>
        <div className="flex items-center justify-center py-4">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="rounded-full w-10 h-10 object-cover border border-[--sidebar-border]"
            />
          ) : (
            <span className="inline-flex items-center justify-center rounded-full w-10 h-10 font-bold text-white bg-blue-600">
              {user?.fullName
                ? user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "?"}
            </span>
          )}
        </div>
      </aside>
      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-2 left-2 z-50">
        <button
          className="p-2 rounded-full border border-[--sidebar-border] bg-[--sidebar] flex items-center justify-center shadow"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>
      </div>
      <aside
        className={`md:hidden fixed top-0 left-0 h-screen z-50 bg-[--sidebar] border-r border-[--sidebar-border] shadow-lg transition-transform duration-200 flex flex-col py-2 px-2 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } w-64`}
        style={{ maxWidth: "16rem", background: "var(--sidebar, #fff)" }}
      >
        <div className="relative flex items-center h-16 px-4">
          <span className="font-bold text-lg text-blue-700">Suite33</span>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-blue-900/60 border border-[--sidebar-border] shadow p-2 rounded-full flex items-center justify-center"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 flex flex-col gap-2 py-6 px-2">
          {links.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition font-medium ${
                pathname === href
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700"
                  : "text-[--sidebar-foreground] hover:bg-blue-50 dark:hover:bg-blue-900/40"
              }`}
            >
              <Icon size={22} />
              <span className="truncate">{label}</span>
            </a>
          ))}
        </nav>
        <div className="flex items-center justify-center py-4">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="rounded-full w-10 h-10 object-cover border border-[--sidebar-border]"
            />
          ) : (
            <span className="inline-flex items-center justify-center rounded-full w-10 h-10 font-bold text-white bg-blue-600">
              {user?.fullName
                ? user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "?"}
            </span>
          )}
        </div>
      </aside>
    </>
  );
}
