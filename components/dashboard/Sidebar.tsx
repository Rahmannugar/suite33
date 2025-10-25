"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  Menu,
  X,
  Home,
  Wallet,
  TrendingUp,
  Boxes,
  Users2,
  Settings,
  BadgeDollarSign,
} from "lucide-react";
import { useState } from "react";

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
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  let links = staffLinks;
  if (user?.role === "ADMIN") links = adminLinks;
  else if (user?.role === "SUB_ADMIN") links = subAdminLinks;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-[--sidebar] border-r border-[--sidebar-border] fixed top-0 left-0 z-30">
        <div className="flex flex-col gap-2 py-6 px-4">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition ${
                pathname === href
                  ? "bg-blue-600 text-white shadow"
                  : "text-[--sidebar-foreground] hover:bg-blue-50 dark:hover:bg-blue-900/40"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </div>
      </aside>
      {/* Mobile Drawer */}
      <div className="md:hidden fixed top-2 left-2 z-40">
        <button
          className="p-2 rounded-md border border-[--sidebar-border] bg-[--sidebar] flex items-center justify-center"
          onClick={() => setOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar overlay"
          />
          <aside className="relative w-64 h-full bg-[--sidebar] border-r border-[--sidebar-border] flex flex-col py-6 px-4">
            <button
              className="absolute top-4 right-4 p-2 rounded-md border border-[--sidebar-border] bg-[--sidebar] flex items-center justify-center"
              onClick={() => setOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={22} />
            </button>
            <div className="flex flex-col gap-2 mt-8">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition ${
                    pathname === href
                      ? "bg-blue-600 text-white shadow"
                      : "text-[--sidebar-foreground] hover:bg-blue-50 dark:hover:bg-blue-900/40"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
