"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  Wallet,
  Users2,
  Boxes,
  BadgeDollarSign,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useSales } from "@/lib/hooks/useSales";
import { useExpenditures } from "@/lib/hooks/useExpenditures";
import { useStaff } from "@/lib/hooks/useStaff";
import { useInventory } from "@/lib/hooks/useInventory";
import { usePayroll } from "@/lib/hooks/usePayroll";
import { useMemo } from "react";

function getEmptyText(feature: string, role: string) {
  if (role === "ADMIN" || role === "SUB_ADMIN") {
    return `${feature} is empty, start adding.`;
  }
  return `${feature} is empty, please contact admin.`;
}

export default function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const { sales, isLoading: salesLoading } = useSales();
  const { expenditures, isLoading: expLoading } = useExpenditures();
  const { staff, isLoading: staffLoading } = useStaff();
  const { inventory, isLoading: invLoading } = useInventory();
  const { payroll, isLoading: payrollLoading } = usePayroll();

  const role = user?.role ?? "STAFF";
  const currentYear = new Date().getFullYear();

  const salesChartData = sales?.length
    ? Array.from({ length: 12 }, (_, i) => {
        const monthName = new Date(2000, i).toLocaleString("default", {
          month: "short",
        });
        const monthSales = sales.filter(
          (s: any) =>
            new Date(s.date).getFullYear() === currentYear &&
            new Date(s.date).getMonth() === i
        );
        return {
          name: monthName,
          sales: monthSales.reduce((sum, s) => sum + s.amount, 0),
        };
      })
    : [];

  const expChartData = expenditures?.length
    ? Array.from({ length: 12 }, (_, i) => {
        const monthName = new Date(2000, i).toLocaleString("default", {
          month: "short",
        });
        const monthExp = expenditures.filter(
          (e: any) =>
            new Date(e.date).getFullYear() === currentYear &&
            new Date(e.date).getMonth() === i
        );
        return {
          name: monthName,
          exp: monthExp.reduce((sum, e) => sum + e.amount, 0),
        };
      })
    : [];

  // Calculate P&L table data
  const pnlTable = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthSales =
        sales?.filter(
          (s: any) =>
            new Date(s.date).getFullYear() === currentYear &&
            new Date(s.date).getMonth() === i
        ) ?? [];
      const monthExp =
        expenditures?.filter(
          (e: any) =>
            new Date(e.date).getFullYear() === currentYear &&
            new Date(e.date).getMonth() === i
        ) ?? [];
      const salesTotal = monthSales.reduce((sum, s) => sum + s.amount, 0);
      const expTotal = monthExp.reduce((sum, e) => sum + e.amount, 0);
      return {
        month: new Date(2000, i).toLocaleString("default", { month: "long" }),
        sales: salesTotal,
        expenditures: expTotal,
        pnl: salesTotal - expTotal,
      };
    });
  }, [sales, expenditures, currentYear]);

  const yearSales = pnlTable.reduce((sum, row) => sum + row.sales, 0);
  const yearExp = pnlTable.reduce((sum, row) => sum + row.expenditures, 0);
  const yearPnl = yearSales - yearExp;

  return (
    <div>
      {/* User Info Card */}
      <div className="mb-6">
        <div className="rounded-xl border border-[--border] bg-[--card] p-4 flex flex-col sm:flex-row items-center gap-4">
          <div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">
              {user?.businessName || "Business"}
            </div>
            <div className="font-semibold text-blue-700">
              Role:{" "}
              {user?.role === "ADMIN"
                ? "Admin"
                : user?.role === "SUB_ADMIN"
                ? "Assistant Admin"
                : "Staff"}
            </div>
            <div className="text-sm text-[--muted-foreground]">
              Department: {user?.departmentName || "No department"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="text-sm text-[--muted-foreground]">
                Loading...
              </div>
            ) : salesChartData.length ? (
              <>
                <div className="font-bold text-2xl">
                  ₦
                  {sales
                    .filter(
                      (s: any) => new Date(s.date).getFullYear() === currentYear
                    )
                    .reduce((sum, s) => sum + s.amount, 0)
                    .toLocaleString()}
                </div>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="text-sm text-[--muted-foreground]">
                {getEmptyText("Sales", role)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet size={20} className="text-blue-600" />
              Expenditures
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expLoading ? (
              <div className="text-sm text-[--muted-foreground]">
                Loading...
              </div>
            ) : expChartData.length ? (
              <>
                <div className="font-bold text-2xl">
                  ₦
                  {expenditures
                    .filter(
                      (e: any) => new Date(e.date).getFullYear() === currentYear
                    )
                    .reduce((sum, e) => sum + e.amount, 0)
                    .toLocaleString()}
                </div>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={expChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="exp" fill="#eab308" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="text-sm text-[--muted-foreground]">
                {getEmptyText("Expenditures", role)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 size={20} className="text-blue-600" />
              Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            {staffLoading ? (
              <div className="text-sm text-[--muted-foreground]">
                Loading...
              </div>
            ) : staff?.length ? (
              <>
                <div className="font-bold text-2xl">{staff.length}</div>
                <div className="text-sm text-[--muted-foreground]">
                  Active staff
                </div>
              </>
            ) : (
              <div className="text-sm text-[--muted-foreground]">
                {getEmptyText("Staff", role)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes size={20} className="text-blue-600" />
              Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invLoading ? (
              <div className="text-sm text-[--muted-foreground]">
                Loading...
              </div>
            ) : inventory?.length ? (
              <>
                <div className="font-bold text-2xl">{inventory.length}</div>
                <div className="text-sm text-[--muted-foreground]">
                  Items tracked
                </div>
              </>
            ) : (
              <div className="text-sm text-[--muted-foreground]">
                {getEmptyText("Inventory", role)}
              </div>
            )}
          </CardContent>
        </Card>
        <div className="col-span-1 md:col-span-2 xl:col-span-4 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeDollarSign size={20} className="text-blue-600" />
                Payroll Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payrollLoading ? (
                <div className="text-sm text-[--muted-foreground]">
                  Loading...
                </div>
              ) : payroll?.length ? (
                <div className="flex flex-col md:flex-row gap-6">
                  <div>
                    <div className="font-bold text-xl">
                      ₦
                      {payroll
                        .filter((p) => p.status === "Paid")
                        .reduce((sum, p) => sum + p.amount, 0)
                        .toLocaleString()}
                    </div>
                    <div className="text-sm text-[--muted-foreground]">
                      Total paid this month
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-xl">
                      ₦
                      {payroll
                        .filter((p) => p.status !== "Paid")
                        .reduce((sum, p) => sum + p.amount, 0)
                        .toLocaleString()}
                    </div>
                    <div className="text-sm text-[--muted-foreground]">
                      Pending payroll
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[--muted-foreground]">
                  {getEmptyText("Payroll", role)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Tab */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">
          Monthly & Yearly Revenue (P&L)
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full border rounded">
            <thead>
              <tr className="bg-blue-50 dark:bg-blue-900/40">
                <th className="p-2 text-left">Month</th>
                <th className="p-2 text-left">Sales</th>
                <th className="p-2 text-left">Expenditures</th>
                <th className="p-2 text-left">Net P&L</th>
              </tr>
            </thead>
            <tbody>
              {pnlTable.map((row) => (
                <tr key={row.month} className="border-t">
                  <td className="p-2">{row.month}</td>
                  <td className="p-2">₦{row.sales.toLocaleString()}</td>
                  <td className="p-2">₦{row.expenditures.toLocaleString()}</td>
                  <td
                    className={`p-2 font-semibold ${
                      row.pnl < 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    ₦{row.pnl.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="bg-blue-100 dark:bg-blue-900/20 font-bold">
                <td className="p-2">Total</td>
                <td className="p-2">₦{yearSales.toLocaleString()}</td>
                <td className="p-2">₦{yearExp.toLocaleString()}</td>
                <td
                  className={`p-2 ${
                    yearPnl < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  ₦{yearPnl.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
