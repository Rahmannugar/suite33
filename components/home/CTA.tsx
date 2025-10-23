import Link from "next/link";

export function CTA() {
  return (
    <section id="cta" className="border-t border-[--border]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="rounded-2xl border border-[--border] bg-[--card] p-8 sm:p-12 flex flex-col lg:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-blue-900 dark:text-blue-100">
              Ready to simplify your business?
            </h3>
            <p className="mt-2 text-[--muted-foreground]">
              Create your business, invite staff, import data. Let Suite33 handle
              the rest.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href="/auth/signup"
              className="inline-flex justify-center rounded-lg bg-blue-600 text-white px-6 py-3 text-base font-semibold shadow hover:bg-blue-700 active:scale-95 transition"
            >
              Create account
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex justify-center rounded-lg border border-blue-600 bg-white text-blue-700 px-6 py-3 text-base font-semibold shadow hover:bg-blue-50 active:scale-95 transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
