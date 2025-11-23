"use client";

import { useMemo, useState, useEffect } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import ByteDatePicker from "byte-datepicker";
import "byte-datepicker/styles.css";

type Mode = "staff" | "dept";

function StatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
        Completed
      </span>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">
        In Progress
      </span>
    );
  }
  if (status === "EXPIRED") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
      Pending
    </span>
  );
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
      mode === "dept" && departmentFilter ? departmentFilter : undefined,
    period: filters.period || undefined,
  });

  const [insightDate, setInsightDate] = useState<Date | null>(new Date());
  const [insightText, setInsightText] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  async function handleGenerateInsight() {
    if (!insightDate) return;
    const year = insightDate.getFullYear();
    const month = insightDate.getMonth() + 1;
    try {
      setInsightLoading(true);
      const text = await generateInsights.mutateAsync({ year, month });
      setInsightText(text);
    } catch {
      toast.error("Failed to generate KPI insights");
    } finally {
      setInsightLoading(false);
    }
  }

  const [dialogOpen, setDialogOpen] = useState(false);
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
      metricType: k.metricType || "number",
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
      metricType: form.metricType || "number",
      target: form.target ? Number(form.target) : null,
      status: form.status,
      period: form.period,
      notes: form.notes || null,
    };

    try {
      if (mode === "staff") {
        if (!form.id) {
          if (!form.staffId) {
            toast.error("Select a staff member");
            return;
          }
          await createStaffKPI.mutateAsync({ ...body, staffId: form.staffId });
          toast.success("Staff KPI created");
        } else {
          await updateStaffKPI.mutateAsync({ ...body, id: form.id });
          toast.success("Staff KPI updated");
        }
      } else {
        if (!form.id) {
          if (!form.departmentId) {
            toast.error("Select a department");
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
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to save KPI");
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
      if (mode === "staff") {
        await deleteStaffKPI.mutateAsync(deleteTarget.id);
      } else {
        await deleteDeptKPI.mutateAsync(deleteTarget.id);
      }
      toast.success("KPI deleted");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to delete KPI");
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

  return (
    <div className="px-4 lg:px-6 py-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">KPIs</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <Button className="cursor-pointer" onClick={openCreate}>
              Add KPI
            </Button>
          </div>
        )}
      </div>

      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold">
              AI KPI Insights
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <ByteDatePicker
                value={insightDate}
                onChange={setInsightDate}
                hideInput={false}
                formatString="mmm yyyy"
              />
              <Button
                className="cursor-pointer"
                onClick={handleGenerateInsight}
                disabled={insightLoading || generateInsights.isPending}
              >
                {insightLoading || generateInsights.isPending
                  ? "Generating..."
                  : "Generate Insights"}
              </Button>
            </div>
          </CardHeader>
          {insightText && (
            <CardContent>
              <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 p-4 text-sm whitespace-pre-line">
                {insightText}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
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
                <SelectTrigger className="w-40">
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
                  <SelectTrigger className="w-48">
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
                hideInput={false}
                formatString="mmm yyyy"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading KPIs...</p>
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
                      <TableHead>Notes</TableHead>
                      {isAdmin && (
                        <TableHead className="w-40">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeList.data.map((k: any) => (
                      <TableRow key={k.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">
                          {k.metric}
                        </TableCell>
                        {mode === "staff" && (
                          <TableCell>
                            {k.staff?.user?.fullName ||
                              k.staff?.user?.email ||
                              "-"}
                          </TableCell>
                        )}
                        {mode === "dept" && (
                          <TableCell>{k.department?.name || "-"}</TableCell>
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
                        <TableCell className="max-w-xs truncate">
                          {k.notes || "—"}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                onClick={() => openEdit(k)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="cursor-pointer"
                                onClick={() => openDelete(k)}
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
                        className="cursor-pointer"
                        isActive={page === i + 1}
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
            <KPIChart summary={summaryQuery.data} />
          </CardContent>
        </Card>
      </div>

      {isStaffRole && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">My KPIs</CardTitle>
            </CardHeader>
            <CardContent>
              {!myStaffKPIs.length ? (
                <p className="text-sm text-muted-foreground">
                  No KPIs assigned to you.
                </p>
              ) : (
                <div className="space-y-2">
                  {myStaffKPIs.map((k: any) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{k.metric}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(k.period).toLocaleString("default", {
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <StatusBadge status={k.status} />
                    </div>
                  ))}
                </div>
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
              {!myDeptKPIs.length ? (
                <p className="text-sm text-muted-foreground">
                  No KPIs for your department.
                </p>
              ) : (
                <div className="space-y-2">
                  {myDeptKPIs.map((k: any) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{k.metric}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(k.period).toLocaleString("default", {
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <StatusBadge status={k.status} />
                    </div>
                  ))}
                </div>
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
                onValueChange={(v) => setForm((f) => ({ ...f, staffId: v }))}
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
                  setForm((f) => ({ ...f, departmentId: v }))
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
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />

            <Input
              placeholder="Target (optional)"
              type="number"
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

            <ByteDatePicker
              value={form.period ? new Date(form.period) : null}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  period: v
                    ? new Date(v.getFullYear(), v.getMonth(), 1).toISOString()
                    : "",
                }))
              }
              hideInput={false}
              formatString="mmm yyyy"
            />

            <Input
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="cursor-pointer" onClick={handleSave}>
              Save
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
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
