import Link from "next/link";

export function CTA() {
  return (
    <section id="cta" className="border-t border-[--border]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="rounded-2xl border border-[--border] bg-[--card] p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold">
              Start with your first KPI in minutes
            </h3>
            <p className="mt-2 text-[--muted-foreground]">
              Create your business, invite staff, import data — Suite33 handles
              the rest.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href="/auth/signup"
              className="inline-flex justify-center rounded-md bg-[--primary] text-[--primary-foreground] px-5 py-3 text-sm font-medium hover:opacity-90 transition"
            >
              Create account
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex justify-center rounded-md border border-[--border] px-5 py-3 text-sm hover:bg-[--muted] transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
