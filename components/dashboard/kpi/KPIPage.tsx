"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useKPIs } from "@/lib/hooks/kpi/useKPIs";
import { useStaff } from "@/lib/hooks/business/useStaff";
import { useDepartments } from "@/lib/hooks/business/useDepartments";
import { useInsightStore } from "@/lib/stores/insightStore";
import { toast } from "sonner";
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Calendar,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import type { StaffKPI, DepartmentKPI } from "@/lib/types/kpi";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

type KPIScope = "STAFF" | "DEPARTMENT" | "BUSINESS";

const STATUS_COLORS = {
  PENDING: "#EAB308",
  IN_PROGRESS: "#3B82F6",
  COMPLETED: "#10B981",
  EXPIRED: "#EF4444",
};

const STATUS_LABELS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
};

export default function KPIPage() {
  const user = useAuthStore((s) => s.user);
  const { insight, setInsight, clearInsight } = useInsightStore();
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const {
    staffKPIs,
    departmentKPIs,
    myStaffKPIs,
    myDeptKPIs,
    pagination,
    isLoading,
    addKPI,
    editKPI,
    deleteKPI,
    getInsight,
  } = useKPIs(currentPage, perPage);

  const { staff } = useStaff();
  const { departments } = useDepartments();

  const canMutate = user?.role === "ADMIN";
  const canViewInsights = user?.role === "ADMIN";

  const [view, setView] = useState<"staff" | "department">("staff");
  const [search, setSearch] = useState("");
  const [filterScope, setFilterScope] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [editingKPI, setEditingKPI] = useState<
    ((StaffKPI | DepartmentKPI) & { scope: "STAFF" | "DEPARTMENT" }) | null
  >(null);
  const [deletingKPI, setDeletingKPI] = useState<
    ((StaffKPI | DepartmentKPI) & { scope: "STAFF" | "DEPARTMENT" }) | null
  >(null);

  const [form, setForm] = useState({
    scope: "STAFF" as "STAFF" | "DEPARTMENT",
    scopeId: "",
    metric: "",
    description: "",
    metricType: "number",
    status: "PENDING" as string,
    target: "",
    period: new Date(),
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const insightRef = useRef<HTMLDivElement | null>(null);

  const [openPeriodAdd, setOpenPeriodAdd] = useState(false);
  const [openPeriodEdit, setOpenPeriodEdit] = useState(false);
  const [insightPeriod, setInsightPeriod] = useState<Date | null>(new Date());
  const [openInsightPeriod, setOpenInsightPeriod] = useState(false);

  const resetForm = () => {
    setForm({
      scope: "STAFF",
      scopeId: "",
      metric: "",
      description: "",
      metricType: "number",
      status: "PENDING",
      target: "",
      period: new Date(),
      notes: "",
    });
    setOpenPeriodAdd(false);
    setOpenPeriodEdit(false);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterScope, filterStatus, view]);

  useEffect(() => {
    if (insight && insightRef.current) {
      insightRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [insight]);

  const truncate = (text: string | null | undefined, max: number) => {
    if (!text) return "";
    return text.length > max ? text.slice(0, max) + "…" : text;
  };

  const normalizedSearch = search.trim().toLowerCase();

  const filteredStaffKPIs = useMemo(() => {
    let base = staffKPIs ?? [];

    if (filterScope !== "all") {
      base = base.filter((k) => k.staffId === filterScope);
    }

    if (filterStatus !== "all") {
      base = base.filter((k) => k.status === filterStatus);
    }

    if (normalizedSearch) {
      base = base.filter(
        (k) =>
          k.metric.toLowerCase().includes(normalizedSearch) ||
          k.description?.toLowerCase().includes(normalizedSearch) ||
          k.staff?.user.fullName?.toLowerCase().includes(normalizedSearch) ||
          k.staff?.user.email.toLowerCase().includes(normalizedSearch)
      );
    }

    return base.sort(
      (a, b) => new Date(b.period).getTime() - new Date(a.period).getTime()
    );
  }, [staffKPIs, filterScope, filterStatus, normalizedSearch]);

  const filteredDeptKPIs = useMemo(() => {
    let base = departmentKPIs ?? [];

    if (filterScope !== "all") {
      base = base.filter((k) => k.departmentId === filterScope);
    }

    if (filterStatus !== "all") {
      base = base.filter((k) => k.status === filterStatus);
    }

    if (normalizedSearch) {
      base = base.filter(
        (k) =>
          k.metric.toLowerCase().includes(normalizedSearch) ||
          k.description?.toLowerCase().includes(normalizedSearch) ||
          k.department?.name.toLowerCase().includes(normalizedSearch)
      );
    }

    return base.sort(
      (a, b) => new Date(b.period).getTime() - new Date(a.period).getTime()
    );
  }, [departmentKPIs, filterScope, filterStatus, normalizedSearch]);

  const totalStaffPages = pagination?.staffTotal
    ? Math.ceil(pagination.staffTotal / perPage)
    : 1;
  const totalDeptPages = pagination?.deptTotal
    ? Math.ceil(pagination.deptTotal / perPage)
    : 1;

  const chartData = useMemo(() => {
    const allKPIs = view === "staff" ? filteredStaffKPIs : filteredDeptKPIs;
    const statusCount = {
      PENDING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      EXPIRED: 0,
    };

    allKPIs.forEach((kpi) => {
      if (kpi.status in statusCount) {
        statusCount[kpi.status as keyof typeof statusCount]++;
      }
    });

    return Object.entries(statusCount).map(([key, value]) => ({
      name: STATUS_LABELS[key as keyof typeof STATUS_LABELS],
      value,
      color: STATUS_COLORS[key as keyof typeof STATUS_COLORS],
    }));
  }, [filteredStaffKPIs, filteredDeptKPIs, view]);

  const getStatusBadge = (status: string) => {
    const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS];
    const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS];
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </span>
    );
  };

  async function handleInsight() {
    if (!insightPeriod) {
      toast.error("Please select a period for insights");
      return;
    }

    setInsightLoading(true);
    clearInsight();

    try {
      const result = await getInsight.mutateAsync({
        scope: "BUSINESS",
        period: insightPeriod,
      });

      setInsight(result);
      toast.success("AI insights generated!");
      setOpenInsightPeriod(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to generate insights");
    } finally {
      setInsightLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.scopeId || !form.metric) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      await addKPI.mutateAsync({
        scope: form.scope,
        scopeId: form.scopeId,
        metric: form.metric,
        description: form.description || undefined,
        metricType: form.metricType,
        status: form.status,
        target: form.target ? parseFloat(form.target) : undefined,
        period: form.period,
        notes: form.notes || undefined,
      });
      toast.success("KPI added successfully!");
      setOpenAdd(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to add KPI");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!editingKPI || !form.metric) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      await editKPI.mutateAsync({
        id: editingKPI.id,
        scope: editingKPI.scope,
        metric: form.metric,
        description: form.description || undefined,
        metricType: form.metricType,
        status: form.status,
        target: form.target ? parseFloat(form.target) : undefined,
        period: form.period,
        notes: form.notes || undefined,
      });
      toast.success("KPI updated successfully!");
      setOpenEdit(false);
      setEditingKPI(null);
      resetForm();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update KPI");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingKPI) return;

    setDeleting(true);
    try {
      await deleteKPI.mutateAsync({
        id: deletingKPI.id,
        scope: deletingKPI.scope,
      });
      toast.success("KPI deleted successfully!");
      setOpenDelete(false);
      setDeletingKPI(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete KPI");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target size={28} className="text-blue-600" />
            Key Performance Indicators
          </h2>
          <p className="text-sm text-[--muted-foreground] mt-1">
            Track and manage performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canViewInsights && (
            <button
              onClick={() => setOpenInsightPeriod(true)}
              disabled={insightLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles size={16} />
              {insightLoading ? "Generating..." : "AI Insights"}
            </button>
          )}
          {canMutate && (
            <button
              onClick={() => setOpenAdd(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
            >
              <Plus size={16} />
              Add KPI
            </button>
          )}
        </div>
      </div>

      {insight && (
        <motion.div
          ref={insightRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 shadow-sm relative"
        >
          <button
            onClick={clearInsight}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-800 transition cursor-pointer"
            aria-label="Close insight"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={20} className="text-purple-600" />
            <h3 className="font-semibold text-purple-900 dark:text-purple-100">
              AI-Generated Insights
            </h3>
          </div>
          <div className="text-sm text-[--foreground] whitespace-pre-wrap">
            {insight}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 border border-[--border] rounded-lg px-3 py-2 bg-[--card] w-full sm:w-auto">
              <button
                onClick={() => setView("staff")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition cursor-pointer ${
                  view === "staff"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-[--muted]"
                }`}
              >
                Staff KPIs
              </button>
              <button
                onClick={() => setView("department")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition cursor-pointer ${
                  view === "department"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-[--muted]"
                }`}
              >
                Department KPIs
              </button>
            </div>

            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[--muted-foreground]"
              />
              <input
                type="text"
                placeholder="Search KPIs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[--input] bg-[--card] pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Select value={filterScope} onValueChange={setFilterScope}>
              <SelectTrigger className="w-full sm:w-[200px] cursor-pointer">
                <SelectValue placeholder="Filter by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="cursor-pointer">
                  All
                </SelectItem>
                {view === "staff" &&
                  staff?.map((s) => (
                    <SelectItem
                      key={s.id}
                      value={s.id}
                      className="cursor-pointer"
                    >
                      {s.user.fullName || s.user.email}
                    </SelectItem>
                  ))}
                {view === "department" &&
                  departments?.map((d) => (
                    <SelectItem
                      key={d.id}
                      value={d.id}
                      className="cursor-pointer"
                    >
                      {d.name.charAt(0).toUpperCase() + d.name.slice(1)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[200px] cursor-pointer">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="cursor-pointer">
                  All Statuses
                </SelectItem>
                <SelectItem value="PENDING" className="cursor-pointer">
                  Pending
                </SelectItem>
                <SelectItem value="IN_PROGRESS" className="cursor-pointer">
                  In Progress
                </SelectItem>
                <SelectItem value="COMPLETED" className="cursor-pointer">
                  Completed
                </SelectItem>
                <SelectItem value="EXPIRED" className="cursor-pointer">
                  Expired
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-lg bg-[--muted] animate-pulse"
                />
              ))}
            </div>
          ) : view === "staff" ? (
            filteredStaffKPIs.length > 0 ? (
              <>
                <div className="space-y-3">
                  {filteredStaffKPIs.map((kpi) => (
                    <div
                      key={kpi.id}
                      className="rounded-lg border border-[--border] bg-[--card] p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-base">
                              {kpi.metric}
                            </h3>
                            {getStatusBadge(kpi.status)}
                          </div>
                          {kpi.description && (
                            <p className="text-sm text-[--muted-foreground] mb-2">
                              {truncate(kpi.description, 100)}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[--muted-foreground]">
                            <span className="font-medium">
                              {kpi.staff?.user.fullName ||
                                kpi.staff?.user.email}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(kpi.period).toLocaleDateString(
                                "default",
                                {
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </span>
                            {kpi.target && (
                              <>
                                <span>•</span>
                                <span>Target: {kpi.target}</span>
                              </>
                            )}
                            {kpi.notes && (
                              <>
                                <span>•</span>
                                <span>{truncate(kpi.notes, 50)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {canMutate && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingKPI({ ...kpi, scope: "STAFF" });
                                setForm({
                                  scope: "STAFF",
                                  scopeId: kpi.staffId,
                                  metric: kpi.metric,
                                  description: kpi.description || "",
                                  metricType: kpi.metricType,
                                  status: kpi.status,
                                  target: kpi.target?.toString() || "",
                                  period: new Date(kpi.period),
                                  notes: kpi.notes || "",
                                });
                                setOpenEdit(true);
                              }}
                              className="p-2 rounded-md hover:bg-[--muted] transition cursor-pointer"
                              aria-label="Edit KPI"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingKPI({ ...kpi, scope: "STAFF" });
                                setOpenDelete(true);
                              }}
                              className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition cursor-pointer"
                              aria-label="Delete KPI"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {totalStaffPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-md border border-[--border] hover:bg-[--muted] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-[--muted-foreground]">
                      Page {currentPage} of {totalStaffPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalStaffPages, p + 1))
                      }
                      disabled={currentPage === totalStaffPages}
                      className="p-2 rounded-md border border-[--border] hover:bg-[--muted] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Target
                  size={48}
                  className="mx-auto text-[--muted-foreground]"
                />
                <p className="mt-4 text-[--muted-foreground]">
                  No staff KPIs found
                </p>
              </div>
            )
          ) : filteredDeptKPIs.length > 0 ? (
            <>
              <div className="space-y-3">
                {filteredDeptKPIs.map((kpi) => (
                  <div
                    key={kpi.id}
                    className="rounded-lg border border-[--border] bg-[--card] p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base">
                            {kpi.metric}
                          </h3>
                          {getStatusBadge(kpi.status)}
                        </div>
                        {kpi.description && (
                          <p className="text-sm text-[--muted-foreground] mb-2">
                            {truncate(kpi.description, 100)}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[--muted-foreground]">
                          <span className="font-medium">
                            {kpi.department?.name.charAt(0).toUpperCase() +
                              kpi.department?.name.slice(1)}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(kpi.period).toLocaleDateString(
                              "default",
                              {
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                          {kpi.target && (
                            <>
                              <span>•</span>
                              <span>Target: {kpi.target}</span>
                            </>
                          )}
                          {kpi.notes && (
                            <>
                              <span>•</span>
                              <span>{truncate(kpi.notes, 50)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {canMutate && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingKPI({ ...kpi, scope: "DEPARTMENT" });
                              setForm({
                                scope: "DEPARTMENT",
                                scopeId: kpi.departmentId,
                                metric: kpi.metric,
                                description: kpi.description || "",
                                metricType: kpi.metricType,
                                status: kpi.status,
                                target: kpi.target?.toString() || "",
                                period: new Date(kpi.period),
                                notes: kpi.notes || "",
                              });
                              setOpenEdit(true);
                            }}
                            className="p-2 rounded-md hover:bg-[--muted] transition cursor-pointer"
                            aria-label="Edit KPI"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingKPI({ ...kpi, scope: "DEPARTMENT" });
                              setOpenDelete(true);
                            }}
                            className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition cursor-pointer"
                            aria-label="Delete KPI"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalDeptPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-[--border] hover:bg-[--muted] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm text-[--muted-foreground]">
                    Page {currentPage} of {totalDeptPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalDeptPages, p + 1))
                    }
                    disabled={currentPage === totalDeptPages}
                    className="p-2 rounded-md border border-[--border] hover:bg-[--muted] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Target size={48} className="mx-auto text-[--muted-foreground]" />
              <p className="mt-4 text-[--muted-foreground]">
                No department KPIs found
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[--border] bg-[--card] p-6">
          <h3 className="font-semibold text-lg mb-4">Status Overview</h3>
          {chartData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-[--muted-foreground]">
              No data available
            </div>
          )}
          <div className="mt-4 space-y-2">
            {chartData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(user?.role === "STAFF" || user?.role === "SUB_ADMIN") && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">My KPIs</h3>

          {myStaffKPIs && myStaffKPIs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[--muted-foreground]">
                Personal KPIs
              </h4>
              {myStaffKPIs.map((kpi) => (
                <div
                  key={kpi.id}
                  className="rounded-lg border border-[--border] bg-[--card] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base">
                          {kpi.metric}
                        </h3>
                        {getStatusBadge(kpi.status)}
                      </div>
                      {kpi.description && (
                        <p className="text-sm text-[--muted-foreground] mb-2">
                          {kpi.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[--muted-foreground]">
                        <span>
                          {new Date(kpi.period).toLocaleDateString("default", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {kpi.target && (
                          <>
                            <span>•</span>
                            <span>Target: {kpi.target}</span>
                          </>
                        )}
                        {kpi.notes && (
                          <>
                            <span>•</span>
                            <span>{kpi.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {myDeptKPIs && myDeptKPIs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[--muted-foreground]">
                Department KPIs
              </h4>
              {myDeptKPIs.map((kpi) => (
                <div
                  key={kpi.id}
                  className="rounded-lg border border-[--border] bg-[--card] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base">
                          {kpi.metric}
                        </h3>
                        {getStatusBadge(kpi.status)}
                      </div>
                      {kpi.description && (
                        <p className="text-sm text-[--muted-foreground] mb-2">
                          {kpi.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[--muted-foreground]">
                        <span className="font-medium">
                          {kpi.department?.name.charAt(0).toUpperCase() +
                            kpi.department?.name.slice(1)}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(kpi.period).toLocaleDateString("default", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {kpi.target && (
                          <>
                            <span>•</span>
                            <span>Target: {kpi.target}</span>
                          </>
                        )}
                        {kpi.notes && (
                          <>
                            <span>•</span>
                            <span>{kpi.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(!myStaffKPIs || myStaffKPIs.length === 0) &&
            (!myDeptKPIs || myDeptKPIs.length === 0) && (
              <div className="text-center py-8 text-[--muted-foreground]">
                <Target size={48} className="mx-auto mb-2" />
                <p>No KPIs assigned to you yet</p>
              </div>
            )}
        </div>
      )}

      <Dialog
        open={openAdd}
        onOpenChange={(open) => {
          setOpenAdd(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New KPI</DialogTitle>
            <DialogDescription>
              Create a new performance indicator
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
            }}
            className="space-y-4"
          >
            <Select
              value={form.scope}
              onValueChange={(v) =>
                setForm({ ...form, scope: v as "STAFF" | "DEPARTMENT" })
              }
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF" className="cursor-pointer">
                  Staff KPI
                </SelectItem>
                <SelectItem value="DEPARTMENT" className="cursor-pointer">
                  Department KPI
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={form.scopeId}
              onValueChange={(v) => setForm({ ...form, scopeId: v })}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue
                  placeholder={
                    form.scope === "STAFF"
                      ? "Select staff"
                      : "Select department"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {form.scope === "STAFF" &&
                  staff?.map((s) => (
                    <SelectItem
                      key={s.id}
                      value={s.id}
                      className="cursor-pointer"
                    >
                      {s.user.fullName || s.user.email}
                    </SelectItem>
                  ))}
                {form.scope === "DEPARTMENT" &&
                  departments?.map((d) => (
                    <SelectItem
                      key={d.id}
                      value={d.id}
                      className="cursor-pointer"
                    >
                      {d.name.charAt(0).toUpperCase() + d.name.slice(1)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <input
              type="text"
              placeholder="Metric name *"
              value={form.metric}
              onChange={(e) => setForm({ ...form, metric: e.target.value })}
              required
              className="w-full rounded-lg border border-[--input] bg-[--card] px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />

            <input
              type="text"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-lg border border-[--input] bg-[--card] px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />

            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING" className="cursor-pointer">
                  Pending
                </SelectItem>
                <SelectItem value="IN_PROGRESS" className="cursor-pointer">
                  In Progress
                </SelectItem>
                <SelectItem value="COMPLETED" className="cursor-pointer">
                  Completed
                </SelectItem>
                <SelectItem value="EXPIRED" className="cursor-pointer">
                  Expired
                </SelectItem>
              </SelectContent>
            </Select>

            <input
              type="number"
              placeholder="Target (optional)"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
              className="w-full rounded-lg border border-[--input] bg-[--card] px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />

            <Popover open={openPeriodAdd} onOpenChange={setOpenPeriodAdd}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 rounded-lg border border-[--input] bg-[--card] px-3 py-2 text-sm text-left hover:bg-[--muted] transition cursor-pointer"
                >
                  <Calendar size={16} />
                  {form.period.toLocaleDateString("default", {
                    month: "short",
                    year: "numeric",
                  })}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={form.period}
                  onSelect={(date) => {
                    if (date) setForm({ ...form, period: date });
                    setOpenPeriodAdd(false);
                  }}
                />
              </PopoverContent>
            </Popover>

            <textarea
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-[--input] bg-[--card] px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpenAdd(false);
                  resetForm();
                }}
                className="flex-1 rounded-lg border border-[--border] px-4 py-2 text-sm font-medium hover:bg-[--muted] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? "Adding..." : "Add KPI"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openEdit}
        onOpenChange={(open) => {
          setOpenEdit(open);
          if (!open) {
            setEditingKPI(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit KPI</DialogTitle>
            <DialogDescription>Update performance indicator</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEdit();
            }}
            className="space-y-4"
          >
            <input
              type="text"
              placeholder="Metric name *"
              value={form.metric}
              onChange={(e) => setForm({ ...form, metric: e.target.value })}
              required
              className="w-full rounded-lg border border-[--input] bg-[--card] px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />

            <input
              type="text"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-lg border border-[--input] bg-[--card] px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />

            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING" className="cursor-pointer">
                  Pending
                </SelectItem>
                <SelectItem value="IN_PROGRESS" className="cursor-pointer">
                  In Progress
                </SelectItem>
                <SelectItem value="COMPLETED" className="cursor-pointer">
                  Completed
                </SelectItem>
                <SelectItem value="EXPIRED" className="cursor-pointer">
                  Expired
                </SelectItem>
              </SelectContent>
            </Select>

            <input
              type="number"
              placeholder="Target (optional)"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
              className="w-full rounded-lg border border-[--input] bg-[--card] px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />

            <Popover open={openPeriodEdit} onOpenChange={setOpenPeriodEdit}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 rounded-lg border border-[--input] bg-[--card] px-3 py-2 text-sm text-left hover:bg-[--muted] transition cursor-pointer"
                >
                  <Calendar size={16} />
                  {form.period.toLocaleDateString("default", {
                    month: "short",
                    year: "numeric",
                  })}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={form.period}
                  onSelect={(date) => {
                    if (date) setForm({ ...form, period: date });
                    setOpenPeriodEdit(false);
                  }}
                />
              </PopoverContent>
            </Popover>

            <textarea
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-[--input] bg-[--card] px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpenEdit(false);
                  setEditingKPI(null);
                  resetForm();
                }}
                className="flex-1 rounded-lg border border-[--border] px-4 py-2 text-sm font-medium hover:bg-[--muted] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openDelete}
        onOpenChange={(open) => {
          setOpenDelete(open);
          if (!open) setDeletingKPI(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete KPI</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this KPI? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setOpenDelete(false);
                setDeletingKPI(null);
              }}
              className="flex-1 rounded-lg border border-[--border] px-4 py-2 text-sm font-medium hover:bg-[--muted] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openInsightPeriod} onOpenChange={setOpenInsightPeriod}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Select Period for AI Insights</DialogTitle>
            <DialogDescription>
              Choose a period to analyze KPI performance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 rounded-lg border border-[--input] bg-[--card] px-3 py-2 text-sm text-left hover:bg-[--muted] transition cursor-pointer"
                >
                  <Calendar size={16} />
                  {insightPeriod
                    ? insightPeriod.toLocaleDateString("default", {
                        month: "short",
                        year: "numeric",
                      })
                    : "Select period"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={insightPeriod || undefined}
                  onSelect={(date) => setInsightPeriod(date || null)}
                />
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpenInsightPeriod(false)}
                className="flex-1 rounded-lg border border-[--border] px-4 py-2 text-sm font-medium hover:bg-[--muted] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleInsight}
                disabled={insightLoading || !insightPeriod}
                className="flex-1 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {insightLoading ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
