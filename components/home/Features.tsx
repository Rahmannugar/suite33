import {
  BarChart3,
  Wallet,
  Users2,
  TrendingUp,
  FileDown,
  Upload,
  BrainCircuit,
  Mail,
} from "lucide-react";

const items = [
  {
    icon: TrendingUp,
    title: "Sales Tracking",
    desc: "Record sales quickly and visualize trends over time.",
  },
  {
    icon: Wallet,
    title: "Expenditures",
    desc: "Monitor spending and keep costs under control.",
  },
  {
    icon: Users2,
    title: "Staff & Departments",
    desc: "Create departments and manage staff profiles with roles.",
  },
  {
    icon: BarChart3,
    title: "KPI Tracking",
    desc: "Track KPIs per staff and per department with charts.",
  },
  {
    icon: FileDown,
    title: "CSV/Excel Import",
    desc: "Bring your data from spreadsheets in seconds.",
  },
  {
    icon: Upload,
    title: "Data Export",
    desc: "Export your records as CSV for sharing and backups.",
  },
  {
    icon: BrainCircuit,
    title: "AI Insights",
    desc: "Let AI review sales, expenses, and KPIs for next steps.",
  },
  {
    icon: Mail,
    title: "Staff Emails",
    desc: "Send KPI updates and official notices to your team.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-[--border]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            What you can do with Suite33
          </h2>
          <p className="mt-3 text-[--muted-foreground]">
            A focused toolkit for SMEs: the essentials you need without the
            bloat.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-[--border] bg-[--card] p-5 hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all cursor-pointer flex flex-col gap-2"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-900/40">
                  <Icon size={20} className="text-blue-600" />
                </div>
                <h3 className="font-medium text-base">{title}</h3>
              </div>
              <p className="mt-2 text-sm text-[--muted-foreground]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
