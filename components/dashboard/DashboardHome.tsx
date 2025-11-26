"use client";

import { useMemo } from "react";
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
  Lock,
  Unlock,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useStaff } from "@/lib/hooks/business/useStaff";
import { useInventory } from "@/lib/hooks/inventory/useInventory";
import { useSalesSummary } from "@/lib/hooks/sales/useSalesSummary";
import { useExpendituresSummary } from "@/lib/hooks/expenditures/useExpendituresSummary";
import { usePayrollSummary } from "@/lib/hooks/payroll/usePayrollSummary";
import { SummaryMonth } from "@/lib/utils/chart";
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
import Link from "next/link";
import { getInitials } from "@/lib/utils/getInitials";

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(1)}K`;
  return `₦${value.toLocaleString()}`;
}

function getEmptyText(feature: string, role: string) {
  if (role === "ADMIN" || role === "SUB_ADMIN")
    return `${feature} is empty, start adding.`;
  return `${feature} is empty, please contact admin.`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow">
      <div className="font-medium mb-1">{label}</div>
      <div style={{ color: payload[0].fill }}>
        {payload[0].name}: {formatCurrencyShort(payload[0].value)}
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role ?? "STAFF";
  const currentYear = new Date().getFullYear();

  const { pagination: staffPagination, isLoading: staffLoading } = useStaff();
  const { inventoryPagination, isLoading: invLoading } = useInventory();
  const { data: salesSummary, isLoading: salesLoading } =
    useSalesSummary(currentYear);
  const { data: expSummary, isLoading: expLoading } =
    useExpendituresSummary(currentYear);
  const { data: payrollSummary, isLoading: payrollLoading } =
    usePayrollSummary();

  const salesChartData = useMemo(() => {
    if (!salesSummary) return [];
    return salesSummary.map((m: SummaryMonth) => ({
      name: new Date(2000, m.month - 1).toLocaleString("default", {
        month: "short",
      }),
      sales: m.total,
    }));
  }, [salesSummary]);

  const expChartData = useMemo(() => {
    if (!expSummary) return [];
    return expSummary.map((m: SummaryMonth) => ({
      name: new Date(2000, m.month - 1).toLocaleString("default", {
        month: "short",
      }),
      expenditures: m.total,
    }));
  }, [expSummary]);

  const pnlTable = useMemo(() => {
    if (!salesSummary || !expSummary) return [];
    return Array.from({ length: 12 }, (_, i) => {
      const salesRow = salesSummary.find(
        (m: SummaryMonth) => m.month === i + 1
      );
      const expRow = expSummary.find((m: SummaryMonth) => m.month === i + 1);
      return {
        month: new Date(2000, i).toLocaleString("default", {
          month: "short",
        }),
        sales: salesRow?.total ?? 0,
        expenditures: expRow?.total ?? 0,
        pnl: (salesRow?.total ?? 0) - (expRow?.total ?? 0),
      };
    });
  }, [salesSummary, expSummary]);

  const { yearSales, yearExp, yearPnl } = useMemo(() => {
    const totalSales = pnlTable.reduce((s, r) => s + r.sales, 0);
    const totalExp = pnlTable.reduce((s, r) => s + r.expenditures, 0);
    return {
      yearSales: totalSales,
      yearExp: totalExp,
      yearPnl: totalSales - totalExp,
    };
  }, [pnlTable]);

  return (
    <div className="space-y-8">
      <div className="rounded-xl border bg-[--card] p-5 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
        {user?.businessLogo ? (
          <Image
            src={user.businessLogo}
            alt="Business Logo"
            width={64}
            height={64}
            className="rounded-full object-cover border border-blue-600 w-16 h-16"
          />
        ) : (
          <div className="rounded-full w-16 h-16 bg-blue-600 flex items-center justify-center text-2xl font-bold text-white">
            {getInitials(user?.businessName)}
          </div>
        )}
        <div>
          <div className="font-bold text-lg">
            {user?.businessName?.toUpperCase() ?? "BUSINESS"}
          </div>
          <div className="text-sm text-[--muted-foreground]">
            {role === "ADMIN"
              ? `Admin: ${user?.fullName ?? ""}`
              : role === "SUB_ADMIN"
              ? `Assistant Admin: ${user?.fullName ?? ""}`
              : `Staff: ${user?.fullName ?? ""}`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard
          title="Sales"
          icon={<TrendingUp size={20} className="text-blue-600" />}
          isLoading={salesLoading}
          data={salesChartData}
          total={yearSales}
          dataKey="sales"
          color="#2563eb"
          role={role}
        />
        <MetricCard
          title="Expenditures"
          icon={<Wallet size={20} className="text-amber-500" />}
          isLoading={expLoading}
          data={expChartData}
          total={yearExp}
          dataKey="expenditures"
          color="#eab308"
          role={role}
        />
        <SimpleMetric
          title="Staff"
          icon={<Users2 size={20} className="text-blue-600" />}
          count={staffPagination?.total ?? 0}
          loading={staffLoading}
          subtitle="Active staff"
          role={role}
        />
        <SimpleMetric
          title="Inventory"
          icon={<Boxes size={20} className="text-blue-600" />}
          count={inventoryPagination?.total ?? 0}
          loading={invLoading}
          subtitle="Items tracked"
          role={role}
        />
      </div>

      <Card className="shadow-sm hover:scale-[1.01] transition-transform duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeDollarSign size={20} className="text-blue-600" />
            Payroll Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payrollLoading ? (
            <LoadingPlaceholder />
          ) : !payrollSummary?.latestPeriod ? (
            <p className="text-sm text-[--muted-foreground]">
              {getEmptyText("Payroll", role)}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                {payrollSummary.locked ? (
                  <>
                    <Lock size={18} className="text-red-600" />
                    <span className="text-sm font-medium text-red-600">
                      Latest Batch Locked
                    </span>
                  </>
                ) : (
                  <>
                    <Unlock size={18} className="text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      Latest Batch Unlocked
                    </span>
                  </>
                )}
              </div>

              {role === "ADMIN" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                    <PayrollBlock
                      label="Total paid this month"
                      color="text-green-600"
                      amount={payrollSummary.totalPaid}
                    />
                    <PayrollBlock
                      label="Pending payroll"
                      color="text-amber-600"
                      amount={payrollSummary.totalPending}
                    />
                  </div>
                  <Link
                    href="/dashboard/admin/payroll"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Payroll →
                  </Link>
                </>
              ) : (
                <>
                  {payrollSummary.self ? (
                    <div className="mb-3">
                      <p className="text-xl font-bold">
                        ₦{payrollSummary.self.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-[--muted-foreground]">
                        {payrollSummary.self.paid ? "Paid" : "Not paid"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[--muted-foreground]">
                      No payroll record for this month.
                    </p>
                  )}
                  <Link
                    href="/dashboard/staff/payroll"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    My Payslip →
                  </Link>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
                      className={
                        row.pnl < 0
                          ? "text-red-600 font-semibold"
                          : "text-green-600 font-semibold"
                      }
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
                    className={yearPnl < 0 ? "text-red-600" : "text-green-600"}
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
    <Card className="shadow-sm hover:scale-[1.01] transition-transform duration-200">
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
                <Tooltip content={<CustomTooltip />} />
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
    <Card className="shadow-sm hover:scale-[1.01] transition-transform duration-200">
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
