"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Wallet,
  Users2,
  Boxes,
  BadgeDollarSign,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
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

  const salesChartData = sales?.length
    ? sales.reduce((acc: any[], item) => {
        const month = new Date(item.date).toLocaleString("default", {
          month: "short",
        });
        const found = acc.find((a) => a.name === month);
        if (found) found.sales += item.amount;
        else acc.push({ name: month, sales: item.amount });
        return acc;
      }, [])
    : [];

  const expChartData = expenditures?.length
    ? expenditures.reduce((acc: any[], item) => {
        const month = new Date(item.date).toLocaleString("default", {
          month: "short",
        });
        const found = acc.find((a) => a.name === month);
        if (found) found.exp += item.amount;
        else acc.push({ name: month, exp: item.amount });
        return acc;
      }, [])
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
                ₦{sales.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}
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
