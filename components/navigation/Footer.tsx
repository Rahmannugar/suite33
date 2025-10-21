import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[--border]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[--muted-foreground]">
          © {new Date().getFullYear()} Suite33. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-[--muted-foreground]">
          <Link href="/privacy-policy" className="hover:opacity-80">
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className="hover:opacity-80">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
