export function Testimonials() {
  const testimonials = [
    {
      quote:
        "Suite33 made our finances and payroll so much easier. The dashboard is clear and simple.",
      name: "Aisha Bello",
      role: "Operations Manager, Acme Retail",
    },
    {
      quote:
        "Importing our old data was seamless. Now our staff gets instant updates and insights.",
      name: "John Okoro",
      role: "CEO, Okoro Foods",
    },
    {
      quote:
        "The KPI tracking helps us see who’s performing and where to improve. Highly recommended.",
      name: "Fatima Musa",
      role: "HR Lead, Musa Tech",
    },
    {
      quote:
        "Suite33’s AI insights gave us actionable steps to grow. It’s like having a business coach.",
      name: "Chinedu Eze",
      role: "Founder, Eze Logistics",
    },
    {
      quote:
        "Staff onboarding and department setup took minutes. Our team loves the simplicity.",
      name: "Grace Adeniyi",
      role: "Admin, Adeniyi Farms",
    },
    {
      quote:
        "We track sales and expenses daily. Suite33 keeps everything organized and accessible.",
      name: "Samuel Adeyemi",
      role: "Finance Lead, Adeyemi Stores",
    },
  ];

  return (
    <section id="testimonials" className="border-t border-[--border] bg-[--muted] py-16">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-8">
          What our customers say
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-[--border] bg-gradient-to-br from-white via-[--card] to-blue-50 dark:from-blue-900/30 dark:via-[--card] dark:to-blue-900/10 p-6 shadow-sm hover:shadow-lg hover:border-blue-600 transition cursor-pointer flex flex-col"
            >
              <div className="flex-1 flex items-center">
                <span className="text-base font-medium text-[--foreground] leading-relaxed">
                  {t.quote}
                </span>
              </div>
              <div className="mt-4">
                <div className="font-semibold text-blue-700 dark:text-blue-300">
                  {t.name}
                </div>
                <div className="text-xs text-[--muted-foreground]">
                  {t.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
