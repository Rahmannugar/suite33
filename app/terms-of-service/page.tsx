import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export const metadata = {
  title: "Suite33",
  description:
    "Read the terms of service for Suite33, a business management platform for SMEs. Understand your rights, responsibilities, and how we handle updates and account usage.",
  keywords: [
    "Suite33 terms",
    "terms of service",
    "business management terms",
    "SME platform terms",
    "Suite33 usage policy",
    "account suspension",
  ],
  openGraph: {
    title: "Terms of Service | Suite33",
    description:
      "By using Suite33, you agree to use the platform responsibly and not for illegal activities. Read our terms for details on account usage and updates.",
    url: "https://suite33.vercel.app/terms-of-service",
    type: "article",
  },
};

export default function TermsOfServicePage() {
  return (
    <main>
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl border border-[--border] bg-[--card] shadow p-8">
          <h1 className="text-2xl font-bold mb-6 text-blue-900 dark:text-blue-100">
            Terms of Service
          </h1>
          <p className="mb-4 text-[--muted-foreground]">
            By using Suite33, you agree to use the platform responsibly and not
            for illegal activities.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[--muted-foreground]">
            <li>Suite33 is provided as-is, without warranty of any kind.</li>
            <li>
              We reserve the right to suspend accounts for abuse or fraud.
            </li>
            <li>All content and data remain your property.</li>
            <li>Updates to these terms will be posted here.</li>
          </ul>
        </div>
      </div>
      <Footer />
    </main>
  );
}
