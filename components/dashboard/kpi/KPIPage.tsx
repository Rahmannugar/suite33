"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import ByteDatePicker from "byte-datepicker";
import "byte-datepicker/styles.css";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar as CalendarIcon } from "lucide-react";
import { useKPI } from "@/lib/hooks/kpi/useKPI";
import { useKpiSummary } from "@/lib/hooks/kpi/useKPISummary";
import { useDepartments } from "@/lib/hooks/business/useDepartments";
import { useStaff } from "@/lib/hooks/business/useStaff";
import { useAuthStore } from "@/lib/stores/authStore";
import { KPIChart } from "@/components/dashboard/kpi/KPIChart";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type Mode = "staff" | "dept";

function StatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED")
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
        Completed
      </span>
    );
  if (status === "IN_PROGRESS")
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">
        In Progress
      </span>
    );
  if (status === "EXPIRED")
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">
        Expired
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
      Pending
    </span>
  );
}

function truncate(text: string | null | undefined, max: number) {
  const t = text || "";
  return t.length > max ? t.slice(0, max) + "…" : t;
}

export default function KPIPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const isStaffRole = user?.role === "STAFF" || user?.role === "SUB_ADMIN";

  const { departments } = useDepartments();
  const { staff } = useStaff();

  const {
    getStaffKPIs,
    getDepartmentKPIs,
    createStaffKPI,
    updateStaffKPI,
    deleteStaffKPI,
    createDeptKPI,
    updateDeptKPI,
    deleteDeptKPI,
    generateInsights,
  } = useKPI();

  const [mode, setMode] = useState<Mode>("staff");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [period, setPeriod] = useState<Date | null>(new Date());
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      search,
      status,
      departmentId: departmentFilter,
      period: period
        ? new Date(period.getFullYear(), period.getMonth(), 1).toISOString()
        : "",
      page,
      perPage: 10,
    }),
    [search, status, departmentFilter, period, page]
  );

  const staffParams = filters;
  const deptParams = { ...filters, departmentId: departmentFilter };

  const staffQuery = getStaffKPIs(staffParams);
  const deptQuery = getDepartmentKPIs(deptParams);

  const activeList = mode === "staff" ? staffQuery.data : deptQuery.data;
  const isLoading =
    mode === "staff" ? staffQuery.isLoading : deptQuery.isLoading;

  const totalPages = activeList?.total
    ? Math.ceil(activeList.total / activeList.perPage)
    : 1;

  useEffect(() => {
    setPage(1);
  }, [search, status, departmentFilter, period, mode]);

  const summaryQuery = useKpiSummary({
    departmentId:
      mode === "dept" && departmentFilter !== "all"
        ? departmentFilter
        : undefined,
    period: filters.period || undefined,
  });

  const [insightDate, setInsightDate] = useState<Date | null>(new Date());
  const [insightText, setInsightText] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const insightRef = useRef<HTMLDivElement | null>(null);

  async function handleGenerateInsight() {
    if (!insightDate) return;
    const year = insightDate.getFullYear();
    const month = insightDate.getMonth() + 1;

    try {
      setInsightLoading(true);
      const text = await generateInsights.mutateAsync({ year, month });
      setInsightText(text);
      toast.success("KPI insight generated successfully");

      setTimeout(() => {
        insightRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch {
      toast.error("Failed to generate KPI insight");
    } finally {
      setInsightLoading(false);
    }
  }

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formDateOpen, setFormDateOpen] = useState(false);

  const [form, setForm] = useState({
    id: "",
    metric: "",
    description: "",
    metricType: "number",
    target: "",
    status: "PENDING",
    period: "",
    notes: "",
    staffId: "",
    departmentId: "",
  });

  function openCreate() {
    setForm({
      id: "",
      metric: "",
      description: "",
      metricType: "number",
      target: "",
      status: "PENDING",
      period: period
        ? new Date(period.getFullYear(), period.getMonth(), 1).toISOString()
        : "",
      notes: "",
      staffId: "",
      departmentId: "",
    });
    setDialogOpen(true);
  }

  function openEdit(k: any) {
    setForm({
      id: k.id,
      metric: k.metric,
      description: k.description || "",
      metricType: k.metricType,
      target: k.target != null ? String(k.target) : "",
      status: k.status,
      period: k.period,
      notes: k.notes || "",
      staffId: k.staffId || "",
      departmentId: k.departmentId || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.metric || !form.period) return;

    const body = {
      metric: form.metric,
      description: form.description || null,
      metricType: form.metricType,
      target: form.target ? Number(form.target) : null,
      status: form.status,
      period: form.period,
      notes: form.notes || null,
    };

    try {
      setSaving(true);

      if (mode === "staff") {
        if (!form.id) {
          if (!form.staffId) {
            toast.error("Select a staff member");
            setSaving(false);
            return;
          }
          await createStaffKPI.mutateAsync({
            ...body,
            staffId: form.staffId,
          });
          toast.success("Staff KPI created");
        } else {
          await updateStaffKPI.mutateAsync({ ...body, id: form.id });
          toast.success("Staff KPI updated");
        }
      } else {
        if (!form.id) {
          if (!form.departmentId) {
            toast.error("Select a department");
            setSaving(false);
            return;
          }
          await createDeptKPI.mutateAsync({
            ...body,
            departmentId: form.departmentId,
          });
          toast.success("Department KPI created");
        } else {
          await updateDeptKPI.mutateAsync({ ...body, id: form.id });
          toast.success("Department KPI updated");
        }
      }

      setDialogOpen(false);
    } catch {
      toast.error("Failed to save KPI");
    } finally {
      setSaving(false);
    }
  }

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    metric: string;
  } | null>(null);

  function openDelete(k: any) {
    setDeleteTarget({ id: k.id, metric: k.metric });
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      if (mode === "staff") {
        await deleteStaffKPI.mutateAsync(deleteTarget.id);
      } else {
        await deleteDeptKPI.mutateAsync(deleteTarget.id);
      }
      toast.success("KPI deleted");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete KPI");
    } finally {
      setDeleting(false);
    }
  }

  const staffRecord = useMemo(
    () => staff?.find((s) => s.userId === user?.id),
    [staff, user?.id]
  );

  const myStaffKPIs = useMemo(() => {
    if (!staffRecord || !staffQuery.data?.data) return [];
    return staffQuery.data.data.filter(
      (k: any) => k.staffId === staffRecord.id
    );
  }, [staffRecord, staffQuery.data]);

  const myDeptKPIs = useMemo(() => {
    if (!staffRecord?.departmentId || !deptQuery.data?.data) return [];
    return deptQuery.data.data.filter(
      (k: any) => k.departmentId === staffRecord.departmentId
    );
  }, [staffRecord?.departmentId, deptQuery.data]);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsKpi, setDetailsKpi] = useState<any | null>(null);

  function openDetails(k: any) {
    setDetailsKpi(k);
    setDetailsOpen(true);
  }

  const [staffKpiPage, setStaffKpiPage] = useState(1);
  const [deptKpiPage, setDeptKpiPage] = useState(1);
  const cardPerPage = 4;

  useEffect(() => {
    setStaffKpiPage(1);
  }, [myStaffKPIs.length]);

  useEffect(() => {
    setDeptKpiPage(1);
  }, [myDeptKPIs.length]);

  const staffKpiTotalPages =
    myStaffKPIs.length > 0 ? Math.ceil(myStaffKPIs.length / cardPerPage) : 1;

  const deptKpiTotalPages =
    myDeptKPIs.length > 0 ? Math.ceil(myDeptKPIs.length / cardPerPage) : 1;

  const paginatedMyStaffKPIs = useMemo(
    () =>
      myStaffKPIs.slice(
        (staffKpiPage - 1) * cardPerPage,
        staffKpiPage * cardPerPage
      ),
    [myStaffKPIs, staffKpiPage]
  );

  const paginatedMyDeptKPIs = useMemo(
    () =>
      myDeptKPIs.slice(
        (deptKpiPage - 1) * cardPerPage,
        deptKpiPage * cardPerPage
      ),
    [myDeptKPIs, deptKpiPage]
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="px-4 lg:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl font-semibold">KPIs</h1>
          {isAdmin && (
            <Button
              className="cursor-pointer w-full sm:w-auto"
              onClick={openCreate}
            >
              Add KPI
            </Button>
          )}
        </div>

        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base font-semibold">
                Suite 33 AI Insights
              </CardTitle>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <ByteDatePicker
                  value={insightDate}
                  onChange={setInsightDate}
                  hideInput
                  formatString="mmm yyyy"
                >
                  {({ open, formattedValue }) => (
                    <Button
                      variant="outline"
                      onClick={open}
                      className="w-full sm:w-48 justify-start gap-2 cursor-pointer"
                    >
                      <CalendarIcon size={16} />
                      {formattedValue || "Select period"}
                    </Button>
                  )}
                </ByteDatePicker>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer w-full sm:w-auto"
                  onClick={handleGenerateInsight}
                  disabled={insightLoading || generateInsights.isPending}
                >
                  {insightLoading || generateInsights.isPending
                    ? "Generating..."
                    : "Generate Insights"}
                </Button>
              </div>
            </CardHeader>
            <AnimatePresence>
              {insightText && (
                <motion.div
                  key="kpi-insight"
                  ref={insightRef}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  <CardContent>
                    <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 p-4 text-sm whitespace-pre-line">
                      {insightText}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          <Card>
            <CardHeader className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-base font-semibold">
                  KPI Overview
                </CardTitle>
                <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                  <TabsList>
                    <TabsTrigger value="staff">Staff</TabsTrigger>
                    <TabsTrigger value="dept">Department</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="Search KPI metric..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:max-w-xs"
                />
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
                {mode === "dept" && (
                  <Select
                    value={departmentFilter}
                    onValueChange={setDepartmentFilter}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {departments?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <ByteDatePicker
                  value={period}
                  onChange={setPeriod}
                  hideInput
                  formatString="mmm yyyy"
                >
                  {({ open, formattedValue }) => (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={open}
                      className="w-40 justify-start font-medium cursor-pointer gap-2"
                    >
                      <CalendarIcon size={16} />
                      {formattedValue || "Select period"}
                    </Button>
                  )}
                </ByteDatePicker>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <Skeleton className="h-40 w-full rounded-md" />
              ) : !activeList?.data?.length ? (
                <p className="text-sm text-muted-foreground">No KPIs found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        {mode === "staff" && <TableHead>Assignee</TableHead>}
                        {mode === "dept" && <TableHead>Department</TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Description</TableHead>
                        {isAdmin && (
                          <TableHead className="w-40">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeList.data.map((k: any) => (
                        <TableRow key={k.id} className="hover:bg-muted/40">
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-block max-w-[160px] truncate">
                                  {truncate(k.metric, 20)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{k.metric}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          {mode === "staff" && (
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-block max-w-[160px] truncate">
                                    {truncate(
                                      k.staff?.user?.fullName ||
                                        k.staff?.user?.email ||
                                        "-",
                                      20
                                    )}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {k.staff?.user?.fullName ||
                                    k.staff?.user?.email ||
                                    "-"}
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          )}
                          {mode === "dept" && (
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-block max-w-[160px] truncate">
                                    {truncate(k.department?.name || "-", 20)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {k.department?.name || "-"}
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          )}
                          <TableCell>
                            <StatusBadge status={k.status} />
                          </TableCell>
                          <TableCell>
                            {k.target != null ? k.target : "—"}
                          </TableCell>
                          <TableCell>
                            {new Date(k.period).toLocaleString("default", {
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-block max-w-[160px] truncate">
                                  {truncate(k.description || "—", 20)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {k.description || "—"}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <Button
                                  variant="outline"
                                  onClick={() => openEdit(k)}
                                  className="cursor-pointer flex-1 sm:flex-none min-w-[90px]"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => openDelete(k)}
                                  className="cursor-pointer flex-1 sm:flex-none min-w-[90px]"
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {totalPages > 1 && (
                <Pagination className="mt-2">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        className="cursor-pointer"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          isActive={page === i + 1}
                          className="cursor-pointer"
                          onClick={() => setPage(i + 1)}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        className="cursor-pointer"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                KPI Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summaryQuery.isLoading ? (
                <Skeleton className="w-full h-[280px] rounded-lg" />
              ) : (
                <KPIChart summary={summaryQuery.data} mode={mode} />
              )}
            </CardContent>
          </Card>
        </div>

        {isStaffRole && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  My KPIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-24 w-full rounded-md" />
                ) : myStaffKPIs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No KPIs assigned to you.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {paginatedMyStaffKPIs.map((k: any) => (
                        <div
                          key={k.id}
                          className="rounded-lg border bg-card px-3 py-2 text-sm space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">
                                {truncate(k.metric, 24)}
                              </p>
                              {k.target != null && (
                                <p className="text-xs text-muted-foreground">
                                  Target: {k.target}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {new Date(k.period).toLocaleString("default", {
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            <StatusBadge status={k.status} />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => openDetails(k)}
                          >
                            View KPI details
                          </Button>
                        </div>
                      ))}
                    </div>
                    {staffKpiTotalPages > 1 && (
                      <Pagination className="mt-3">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              className="cursor-pointer"
                              onClick={() =>
                                setStaffKpiPage((p) => Math.max(1, p - 1))
                              }
                            />
                          </PaginationItem>
                          {Array.from(
                            { length: staffKpiTotalPages },
                            (_, i) => (
                              <PaginationItem key={i}>
                                <PaginationLink
                                  isActive={staffKpiPage === i + 1}
                                  className="cursor-pointer"
                                  onClick={() => setStaffKpiPage(i + 1)}
                                >
                                  {i + 1}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          )}
                          <PaginationItem>
                            <PaginationNext
                              className="cursor-pointer"
                              onClick={() =>
                                setStaffKpiPage((p) =>
                                  Math.min(staffKpiTotalPages, p + 1)
                                )
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  My Department KPIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-24 w-full rounded-md" />
                ) : myDeptKPIs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No KPIs for your department.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {paginatedMyDeptKPIs.map((k: any) => (
                        <div
                          key={k.id}
                          className="rounded-lg border bg-card px-3 py-2 text-sm space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">
                                {truncate(k.metric, 24)}
                              </p>
                              {k.target != null && (
                                <p className="text-xs text-muted-foreground">
                                  Target: {k.target}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {new Date(k.period).toLocaleString("default", {
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            <StatusBadge status={k.status} />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => openDetails(k)}
                          >
                            View KPI details
                          </Button>
                        </div>
                      ))}
                    </div>
                    {deptKpiTotalPages > 1 && (
                      <Pagination className="mt-3">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              className="cursor-pointer"
                              onClick={() =>
                                setDeptKpiPage((p) => Math.max(1, p - 1))
                              }
                            />
                          </PaginationItem>
                          {Array.from({ length: deptKpiTotalPages }, (_, i) => (
                            <PaginationItem key={i}>
                              <PaginationLink
                                isActive={deptKpiPage === i + 1}
                                className="cursor-pointer"
                                onClick={() => setDeptKpiPage(i + 1)}
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              className="cursor-pointer"
                              onClick={() =>
                                setDeptKpiPage((p) =>
                                  Math.min(deptKpiTotalPages, p + 1)
                                )
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit KPI" : "Create KPI"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {mode === "staff" ? (
                <Select
                  value={form.staffId}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      staffId: v,
                      departmentId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.user?.fullName || s.user?.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={form.departmentId}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      departmentId: v,
                      staffId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Input
                placeholder="Metric"
                value={form.metric}
                onChange={(e) =>
                  setForm((f) => ({ ...f, metric: e.target.value }))
                }
              />
              <Input
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
              />
              <Input
                placeholder="Target (optional)"
                type="text"
                value={form.target}
                onChange={(e) =>
                  setForm((f) => ({ ...f, target: e.target.value }))
                }
              />
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Popover open={formDateOpen} onOpenChange={setFormDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start gap-2 cursor-pointer w-full"
                  >
                    <CalendarIcon size={16} />
                    {form.period
                      ? new Date(form.period).toLocaleString("default", {
                          month: "short",
                          year: "numeric",
                        })
                      : "Select period"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  side="bottom"
                  sideOffset={8}
                  className="p-0 w-auto left-1/2 transform -translate-x-1/2"
                >
                  <Calendar
                    mode="single"
                    selected={form.period ? new Date(form.period) : undefined}
                    onSelect={(d) => {
                      if (d) {
                        setForm((f) => ({
                          ...f,
                          period: new Date(
                            d.getFullYear(),
                            d.getMonth(),
                            1
                          ).toISOString(),
                        }));
                        setFormDateOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
              <Textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                className="cursor-pointer"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete KPI</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deleteTarget?.metric || "this KPI"}
              </span>
              ? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="cursor-pointer"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>KPI details</DialogTitle>
            </DialogHeader>
            {detailsKpi && (
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Metric</p>
                  <p className="font-medium">{detailsKpi.metric}</p>
                </div>
                {detailsKpi.staff?.user && (
                  <div>
                    <p className="text-xs text-muted-foreground">Assignee</p>
                    <p>
                      {detailsKpi.staff.user.fullName ||
                        detailsKpi.staff.user.email}
                    </p>
                  </div>
                )}
                {detailsKpi.department && (
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p>{detailsKpi.department.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <StatusBadge status={detailsKpi.status} />
                </div>
                {detailsKpi.target != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p>{detailsKpi.target}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Period</p>
                  <p>
                    {new Date(detailsKpi.period).toLocaleString("default", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {detailsKpi.description && (
                  <div>
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p>{detailsKpi.description}</p>
                  </div>
                )}
                {detailsKpi.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p>{detailsKpi.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
