import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export default function TermsOfServicePage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl border border-[--border] bg-[--card] shadow p-8">
          <h1 className="text-2xl font-bold mb-6 text-blue-900 dark:text-blue-100">
            Terms of Service
          </h1>
          <p className="mb-4 text-[--muted-foreground]">
            By using Suite33, you agree to use the platform responsibly and not for illegal activities.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[--muted-foreground]">
            <li>Suite33 is provided as-is, without warranty of any kind.</li>
            <li>We reserve the right to suspend accounts for abuse or fraud.</li>
            <li>All content and data remain your property.</li>
            <li>Updates to these terms will be posted here.</li>
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}