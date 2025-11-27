"use client";

import { useState } from "react";
import { usePayroll } from "@/lib/hooks/payroll/usePayroll";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { toast } from "sonner";
import Link from "next/link";

const PAGE_SIZE = 20;

export default function PayrollPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const basePath = isAdmin
    ? "/dashboard/admin/payroll"
    : "/dashboard/staff/payroll";

  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [openPicker, setOpenPicker] = useState(false);
  const [period, setPeriod] = useState(new Date());
  const [saving, setSaving] = useState(false);

  const { batches, createBatch } = usePayroll();
  const list = batches.data ?? [];
  const totalPages = Math.ceil(list.length / PAGE_SIZE) || 1;
  const paginated = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleCreate() {
    try {
      setSaving(true);

      const finalDate = new Date(
        Date.UTC(period.getFullYear(), period.getMonth(), 1)
      );

      await createBatch.mutateAsync({
        period: finalDate.toISOString(),
      });

      toast.success("Payroll batch created");
      setCreateOpen(false);
    } catch {
      toast.error("Failed to create payroll batch");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="px-4 lg:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl font-semibold">Payroll</h1>

          {isAdmin && (
            <Button
              className="cursor-pointer w-full sm:w-auto"
              onClick={() => setCreateOpen(true)}
            >
              Create Payroll Batch
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base font-semibold">
              Payroll Batches
            </CardTitle>
          </CardHeader>

          <CardContent>
            {batches.isLoading ? (
              <Skeleton className="h-40 w-full rounded-md" />
            ) : !list.length ? (
              <p className="text-sm text-muted-foreground">
                No payroll batches found.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Locked</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((b: any) => (
                        <TableRow key={b.id} className="hover:bg-muted/40">
                          <TableCell>
                            {new Date(b.period).toLocaleString("default", {
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell>{b.locked ? "Yes" : "No"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              asChild
                            >
                              <Link href={`${basePath}/${b.id}`}>View</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <Pagination className="mt-4">
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payroll Batch</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Popover open={openPicker} onOpenChange={setOpenPicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 cursor-pointer"
                >
                  <CalendarIcon size={16} />
                  {period
                    ? period.toLocaleString("default", {
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
                  selected={period}
                  onSelect={(d) => {
                    if (d) setPeriod(d);
                    setOpenPicker(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setCreateOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              className="cursor-pointer"
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
