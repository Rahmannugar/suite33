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

  return (
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
            <div className="text-sm text-[--muted-foreground]">Loading...</div>
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
            <div className="text-sm text-[--muted-foreground]">Loading...</div>
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
            <div className="text-sm text-[--muted-foreground]">Loading...</div>
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
            <div className="text-sm text-[--muted-foreground]">Loading...</div>
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
  );
}
