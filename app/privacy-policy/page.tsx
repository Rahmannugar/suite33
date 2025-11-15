import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";

export const metadata = {
  title: "Suite33",
  description:
    "Learn how Suite33 protects your privacy, secures your data, and handles your personal information. We do not sell your data and only use it to provide and improve our services.",
  keywords: [
    "Suite33 privacy",
    "data protection",
    "business management privacy",
    "SME privacy policy",
    "secure business platform",
    "Suite33 data security",
  ],
  openGraph: {
    title: "Privacy Policy | Suite33",
    description:
      "Suite33 respects your privacy. We do not sell your data. Your business and personal information is only used to provide and improve our services.",
    url: "https://suite33.vercel.app/privacy-policy",
    type: "article",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl border border-[--border] bg-[--card] shadow p-8">
          <h1 className="text-2xl font-bold mb-6 text-blue-900 dark:text-blue-100">
            Privacy Policy
          </h1>
          <p className="mb-4 text-[--muted-foreground]">
            Suite33 respects your privacy. We do not sell your data. Your
            business and personal information is only used to provide and
            improve our services.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[--muted-foreground]">
            <li>
              We store your data securely and never share it with third parties
              except as required by law.
            </li>
            <li>
              All passwords are encrypted and never visible to Suite33 staff.
            </li>
            <li>
              You can request deletion of your account and data at any time.
            </li>
            <li>
              For questions, contact{" "}
              <a
                href="mailto:cladeadenugar@gmail.com"
                className="text-blue-600 underline"
              >
                cladeadenugar@gmail.com
              </a>
              .
            </li>
          </ul>
        </div>
      </div>
      <Footer />
    </>
  );
}
