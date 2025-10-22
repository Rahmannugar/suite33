"use client";

import Link from "next/link";
import { Sparkles, BarChart3, Users2, Wallet, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

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
              Suite33 for SMEs
            </span>

            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              Manage business, people, and KPIs in one place.
            </h1>

            <p className="mt-4 text-[--muted-foreground] text-base sm:text-lg max-w-prose">
              Track sales, expenses, staff, and payroll. Import data, get AI
              insights, and grow smarter.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex justify-center items-center rounded-lg bg-blue-600 text-white px-6 py-3 text-base font-semibold shadow hover:bg-blue-700 active:scale-95 transition-all duration-150 focus:ring-2 focus:ring-blue-300"
              >
                Get started
              </Link>
              <a
                href="#features"
                className="inline-flex justify-center items-center rounded-lg border border-blue-600 bg-white text-blue-700 px-6 py-3 text-base font-semibold shadow hover:bg-blue-50 active:scale-95 transition-all duration-150 focus:ring-2 focus:ring-blue-300"
              >
                Explore features
              </a>
            </div>
          </div>

          {/* Responsive, professional dashboard skeleton */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-[360px] bg-white dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-xl shadow-lg p-6 flex flex-col gap-5 cursor-pointer">
              {/* Top KPIs */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  whileHover={{
                    scale: 1.08,
                    boxShadow: "0 4px 24px rgba(37,99,235,0.10)",
                    backgroundColor: "#eff6ff",
                  }}
                  className="rounded-lg bg-blue-50 dark:bg-blue-900/40 p-3 flex items-center gap-2 shadow-sm transition"
                >
                  <TrendingUp size={18} className="text-blue-600" />
                  <div>
                    <div className="text-xs text-blue-900 dark:text-blue-100">
                      Sales
                    </div>
                    <div className="font-bold text-sm text-blue-900 dark:text-blue-100">
                      ₦1.2M
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{
                    scale: 1.08,
                    boxShadow: "0 4px 24px rgba(37,99,235,0.10)",
                    backgroundColor: "#eff6ff",
                  }}
                  className="rounded-lg bg-blue-50 dark:bg-blue-900/40 p-3 flex items-center gap-2 shadow-sm transition"
                >
                  <Wallet size={18} className="text-blue-600" />
                  <div>
                    <div className="text-xs text-blue-900 dark:text-blue-100">
                      Expenses
                    </div>
                    <div className="font-bold text-sm text-blue-900 dark:text-blue-100">
                      ₦450K
                    </div>
                  </div>
                </motion.div>
              </div>
              {/* Chart */}
              <div className="bg-blue-50 dark:bg-blue-900/40 rounded-lg p-4 flex flex-col items-center shadow-sm">
                <BarChart3 size={22} className="text-blue-600 mb-2" />
                <div className="w-full h-14 flex items-end gap-1">
                  {[6, 10, 8, 12, 7, 9].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h * 1.5 + 20}px` }}
                      transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
                      className="w-1/6 bg-blue-600/70 rounded"
                    />
                  ))}
                </div>
                <div className="mt-2 text-xs text-blue-900 dark:text-blue-100">
                  Monthly Sales
                </div>
              </div>
              {/* Staff & KPIs */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  whileHover={{
                    scale: 1.08,
                    boxShadow: "0 4px 24px rgba(37,99,235,0.10)",
                    backgroundColor: "#eff6ff",
                  }}
                  className="rounded-lg bg-blue-50 dark:bg-blue-900/40 p-3 flex items-center gap-2 shadow-sm transition"
                >
                  <Users2 size={18} className="text-blue-600" />
                  <div>
                    <div className="text-xs text-blue-900 dark:text-blue-100">
                      Staff
                    </div>
                    <div className="font-bold text-sm text-blue-900 dark:text-blue-100">
                      12 Active
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{
                    scale: 1.08,
                    boxShadow: "0 4px 24px rgba(37,99,235,0.10)",
                    backgroundColor: "#eff6ff",
                  }}
                  className="rounded-lg bg-blue-50 dark:bg-blue-900/40 p-3 flex items-center gap-2 shadow-sm transition"
                >
                  <BarChart3 size={18} className="text-blue-600" />
                  <div>
                    <div className="text-xs text-blue-900 dark:text-blue-100">
                      KPIs
                    </div>
                    <div className="font-bold text-sm text-blue-900 dark:text-blue-100">
                      7 Tracked
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
