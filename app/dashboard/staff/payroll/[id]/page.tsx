import SinglePayrollPage from "@/components/dashboard/payroll/SinglePayrollPage";

export default async function StaffSinglePayrollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SinglePayrollPage id={id} />;
}
