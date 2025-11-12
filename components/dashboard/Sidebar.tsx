"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { useSidebarStore } from "@/lib/stores/sidebarStore";

type SidebarLink = { href: string; label: string; icon: any };

const adminLinks: SidebarLink[] = [
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

const staffLinks: SidebarLink[] = [
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

const subAdminLinks = staffLinks;

function getLinksByRole(role?: string) {
  if (role === "ADMIN") return adminLinks;
  if (role === "SUB_ADMIN") return subAdminLinks;
  return staffLinks;
}

export default function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } =
    useSidebarStore();

  const links = getLinksByRole(user?.role);
  const desktopWidthClass = collapsed ? "w-20" : "w-64";

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`${desktopWidthClass} hidden md:flex flex-col h-screen fixed top-0 left-0 z-40 bg-[--sidebar] shadow-lg transition-all duration-200`}
        style={{ background: "var(--sidebar, #fff)" }}
      >
        <div className="relative flex items-center h-16 px-4">
          <div
            className={`font-bold text-lg text-blue-600 dark:text-blue-300 transition-all duration-200 ${
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            }`}
          >
            Suite33
          </div>

          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed(!collapsed)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-[--card] border border-[--sidebar-border] p-2 rounded-full shadow-sm cursor-pointer hover:scale-95 duration-200 transition-all"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1 py-4 px-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => {
                  if (mobileOpen) setMobileOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition font-medium ${
                  active
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-100"
                    : "text-[--sidebar-foreground] hover:bg-blue-50 dark:hover:bg-blue-800"
                }`}
                aria-current={active ? "page" : undefined}
                style={{ justifyContent: collapsed ? "center" : "flex-start" }}
              >
                <Icon size={20} />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile toggle button */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button
          className="p-2 rounded-full border border-[--sidebar-border] bg-[--sidebar] flex items-center justify-center shadow"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-screen z-50 bg-[--sidebar] shadow-lg transition-transform duration-200 flex flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } w-64`}
        style={{ background: "var(--sidebar, #fff)" }}
        aria-hidden={!mobileOpen}
      >
        <div className="relative flex items-center h-16 px-4">
          <div className="font-bold text-lg text-blue-600 dark:text-blue-300">
            Suite33
          </div>
          <button
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-[--card] border border-[--sidebar-border] p-2 rounded-full shadow-sm"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 flex flex-col gap-1 py-2 px-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition font-medium ${
                  active
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-100"
                    : "text-[--sidebar-foreground] hover:bg-blue-50 dark:hover:bg-blue-800"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={20} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
