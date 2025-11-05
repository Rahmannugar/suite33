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
import { useProfile } from "@/lib/hooks/useProfile";
import type { Sale } from "@/lib/types/sale";
import type { Expenditure } from "@/lib/types/expenditure";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(1)}K`;
  return `₦${value.toLocaleString()}`;
}

function getEmptyText(feature: string, role: string) {
  if (role === "ADMIN" || role === "SUB_ADMIN") {
    return `${feature} is empty, start adding.`;
  }
  return `${feature} is empty, please contact admin.`;
}

export default function DashboardHome() {
  const user = useAuthStore((state) => state.user);
  const { sales, isLoading: salesLoading } = useSales();
  const { expenditures, isLoading: expLoading } = useExpenditures();
  const { staff, isLoading: staffLoading } = useStaff();
  const { inventory, isLoading: invLoading } = useInventory();
  const { payroll, isLoading: payrollLoading } = usePayroll();
  const { profile, isLoading: profileLoading } = useProfile();

  const role = user?.role ?? "STAFF";
  const currentYear = new Date().getFullYear();

  const salesChartData = sales?.length
    ? Array.from({ length: 12 }, (_, i) => {
        const monthName = new Date(2000, i).toLocaleString("default", {
          month: "short",
        });
        const monthSales = sales.filter(
          (s: Sale) =>
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
          (e: Expenditure) =>
            new Date(e.date).getFullYear() === currentYear &&
            new Date(e.date).getMonth() === i
        );
        return {
          name: monthName,
          expenditures: monthExp.reduce((sum, e) => sum + e.amount, 0),
        };
      })
    : [];

  const pnlTable = Array.from({ length: 12 }, (_, i) => {
    const salesMonth =
      sales?.filter(
        (s: Sale) =>
          new Date(s.date).getFullYear() === currentYear &&
          new Date(s.date).getMonth() === i
      ) ?? [];
    const expMonth =
      expenditures?.filter(
        (e: Expenditure) =>
          new Date(e.date).getFullYear() === currentYear &&
          new Date(e.date).getMonth() === i
      ) ?? [];
    return {
      month: new Date(2000, i).toLocaleString("default", { month: "short" }),
      sales: salesMonth.reduce((sum, s) => sum + s.amount, 0),
      expenditures: expMonth.reduce((sum, e) => sum + e.amount, 0),
      pnl:
        salesMonth.reduce((sum, s) => sum + s.amount, 0) -
        expMonth.reduce((sum, e) => sum + e.amount, 0),
    };
  });

  const yearSales = pnlTable.reduce((sum, row) => sum + row.sales, 0);
  const yearExp = pnlTable.reduce((sum, row) => sum + row.expenditures, 0);
  const yearPnl = yearSales - yearExp;

  const businessLogo = user?.businessLogo || null;

  return (
    <div className="space-y-8">
      {/* Business / User Info*/}
      <div className="rounded-xl border border-[--border] bg-[--card] p-5 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
        {businessLogo ? (
          <Image
            src={businessLogo}
            alt="Business Logo"
            width={64}
            height={64}
            className="rounded-full object-cover border border-blue-600 w-16 h-16"
          />
        ) : (
          <div className="rounded-full w-16 h-16 bg-blue-600 flex items-center justify-center text-2xl font-semibold text-white">
            {user?.businessName?.[0] ?? ""}
          </div>
        )}
        <div>
          <div className="font-bold text-lg">
            {user?.businessName?.toUpperCase() ?? "Business"}
          </div>
          <div className="text-sm text-[--muted-foreground]">
            {user?.role === "ADMIN"
              ? `Admin: ${user?.fullName ?? ""}`
              : user?.role === "SUB_ADMIN"
              ? `Assistant Admin: ${user?.fullName ?? ""}`
              : `Staff: ${user?.fullName ?? ""}`}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard
          title="Sales"
          icon={<TrendingUp size={20} className="text-blue-600" />}
          isLoading={salesLoading}
          data={salesChartData}
          total={sales
            ?.filter((s) => new Date(s.date).getFullYear() === currentYear)
            .reduce((sum, s) => sum + s.amount, 0)}
          dataKey="sales"
          color="#2563eb"
          role={role}
        />
        <MetricCard
          title="Expenditures"
          icon={<Wallet size={20} className="text-amber-500" />}
          isLoading={expLoading}
          data={expChartData}
          total={expenditures
            ?.filter((e) => new Date(e.date).getFullYear() === currentYear)
            .reduce((sum, e) => sum + e.amount, 0)}
          dataKey="expenditures"
          color="#eab308"
          role={role}
        />
        <SimpleMetric
          title="Staff"
          icon={<Users2 size={20} className="text-blue-600" />}
          count={staff?.length}
          loading={staffLoading}
          subtitle="Active staff"
          role={role}
        />
        <SimpleMetric
          title="Inventory"
          icon={<Boxes size={20} className="text-blue-600" />}
          count={inventory?.length}
          loading={invLoading}
          subtitle="Items tracked"
          role={role}
        />
      </div>

      {/* Payroll */}
      <Card className="shadow-sm transition-transform duration-200 ease-out hover:scale-[1.01] hover:shadow-md cursor-pointer will-change-transform">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeDollarSign size={20} className="text-blue-600" />
            Payroll Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payrollLoading ? (
            <LoadingPlaceholder />
          ) : payroll?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <PayrollBlock
                label="Total paid this month"
                color="text-green-600"
                amount={payroll
                  .filter((p) => p.paid)
                  .reduce((sum, p) => sum + p.amount, 0)}
              />
              <PayrollBlock
                label="Pending payroll"
                color="text-amber-600"
                amount={payroll
                  .filter((p) => !p.paid)
                  .reduce((sum, p) => sum + p.amount, 0)}
              />
            </div>
          ) : (
            <p className="text-sm text-[--muted-foreground]">
              {getEmptyText("Payroll", role)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ✅ P&L Table (using ShadCN Table) */}
      <Card>
        <CardHeader>
          <CardTitle>P & L Summary – {currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Expenditures</TableHead>
                  <TableHead>Net P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pnlTable.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell>{row.month}</TableCell>
                    <TableCell>₦{row.sales.toLocaleString()}</TableCell>
                    <TableCell>₦{row.expenditures.toLocaleString()}</TableCell>
                    <TableCell
                      className={`font-semibold ${
                        row.pnl < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      ₦{row.pnl.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-blue-50 dark:bg-blue-900/30 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell>₦{yearSales.toLocaleString()}</TableCell>
                  <TableCell>₦{yearExp.toLocaleString()}</TableCell>
                  <TableCell
                    className={`${
                      yearPnl < 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    ₦{yearPnl.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  icon,
  data,
  total,
  dataKey,
  color,
  isLoading,
  role,
}: any) {
  return (
    <Card className="shadow-sm transition-transform duration-200 ease-out hover:scale-[1.01] hover:shadow-md cursor-pointer will-change-transform">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingPlaceholder />
        ) : data?.length ? (
          <>
            <div className="font-bold text-2xl mb-3">
              ₦{total?.toLocaleString()}
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis hide />
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrencyShort(value),
                    title,
                  ]}
                />
                <Bar
                  dataKey={dataKey}
                  name={title}
                  fill={color}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <p className="text-sm text-[--muted-foreground]">
            {getEmptyText(title, role)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SimpleMetric({ title, icon, count, loading, subtitle, role }: any) {
  return (
    <Card className="shadow-sm transition-transform duration-200 ease-out hover:scale-[1.01] hover:shadow-md cursor-pointer will-change-transform">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingPlaceholder />
        ) : count ? (
          <>
            <div className="font-bold text-2xl">{count}</div>
            <p className="text-sm text-[--muted-foreground]">{subtitle}</p>
          </>
        ) : (
          <p className="text-sm text-[--muted-foreground]">
            {getEmptyText(title, role)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PayrollBlock({
  label,
  color,
  amount,
}: {
  label: string;
  color: string;
  amount: number;
}) {
  return (
    <div>
      <p className={`font-bold text-xl ${color}`}>₦{amount.toLocaleString()}</p>
      <p className="text-sm text-[--muted-foreground]">{label}</p>
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="space-y-2 animate-pulse">
      <Skeleton className="h-6 w-1/3 rounded" />
      <Skeleton className="h-32 w-full rounded" />
    </div>
  );
}

