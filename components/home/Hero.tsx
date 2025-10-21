import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle gradient background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-30"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(60rem 30rem at 10% -10%, oklch(0.9 0 0 / .6), transparent 60%), radial-gradient(60rem 30rem at 90% 0%, oklch(0.85 0 0 / .5), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[--border] bg-[--card] px-3 py-1 text-xs text-[--muted-foreground]">
              <Sparkles size={14} />
              All-in-one business management
            </span>

            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              Finance, People, KPIs —{" "}
              <span className="text-[--primary]">together</span> in one suite.
            </h1>

            <p className="mt-4 text-[--muted-foreground] text-base sm:text-lg max-w-prose">
              Suite33 helps SMEs track sales, expenditures, staff performance,
              KPIs, payroll, and more. Import data from CSV/Excel, visualize
              instantly, and get AI insights on what to do next.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex justify-center rounded-md bg-[--primary] text-[--primary-foreground] px-5 py-3 text-sm font-medium hover:opacity-90 transition"
              >
                Get started — it’s free
              </Link>
              <a
                href="#features"
                className="inline-flex justify-center rounded-md border border-[--border] px-5 py-3 text-sm hover:bg-[--muted] transition"
              >
                Explore features
              </a>
            </div>

            <p className="mt-3 text-xs text-[--muted-foreground]">
              No pricing screen. Just sign in and start — you can upgrade later.
            </p>
          </div>

          {/* Logo / brand visual */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-[260px] h-[260px] sm:w-[320px] sm:h-[320px]">
              <Image
                src="/images/suite33-black.png"
                alt="Suite33"
                fill
                className="object-contain dark:hidden"
                priority
              />
              <Image
                src="/images/suite33-white.png"
                alt="Suite33"
                fill
                className="object-contain hidden dark:block"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
