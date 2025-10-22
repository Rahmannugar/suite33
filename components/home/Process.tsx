import { FileDown, Users2, BarChart3, BrainCircuit } from "lucide-react";

const steps = [
  {
    icon: FileDown,
    title: "Import Your Data",
    desc: "Upload your sales, expenses, and staff records from CSV or Excel.",
  },
  {
    icon: Users2,
    title: "Set Up Your Team",
    desc: "Add staff, create departments, and assign roles in minutes.",
  },
  {
    icon: BarChart3,
    title: "Track KPIs & Performance",
    desc: "Monitor key metrics for your business and team with clear dashboards.",
  },
  {
    icon: BrainCircuit,
    title: "Get AI Insights",
    desc: "Receive smart suggestions to improve sales, reduce costs, and grow.",
  },
];

export function Process() {
  return (
    <section
      id="process"
      className="border-t border-[--border] bg-[--muted] py-16"
    >
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-8">
          How Suite33 Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map(({ icon: Icon, title, desc }, idx) => (
            <div
              key={title}
              className="flex flex-col items-center text-center rounded-xl border border-[--border] bg-[--card] p-6 shadow-sm hover:shadow-lg hover:border-blue-600 transition cursor-pointer"
            >
              <div
                className="mb-4 flex items-center justify-center h-12 w-12 rounded-full"
                style={{
                  background:
                    idx === 3
                      ? "linear-gradient(135deg,#6366f1 0%,#2563eb 100%)"
                      : "linear-gradient(135deg,#e0e7ff 0%,#eff6ff 100%)",
                }}
              >
                <Icon
                  size={24}
                  className={idx === 3 ? "text-white" : "text-blue-600"}
                />
              </div>
              <h3 className="font-semibold text-base mb-2 text-blue-900 dark:text-blue-100">
                {title}
              </h3>
              <p className="text-sm text-[--muted-foreground]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
