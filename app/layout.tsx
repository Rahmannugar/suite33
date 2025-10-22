import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import QueryProvider from "@/lib/providers/QueryProvider";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";

const interFont = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://suite33.vercel.app"),
  title: {
    default: "Suite 33",
    template: "%s | Suite 33",
  },
  description:
    "Suite 33 is a simple business management platform that helps small and growing businesses track finances, inventory, staff performance, and payroll with AI insights and easy data import/export.",
  twitter: {
    card: "summary_large_image",
    creator: "@NugarRahman",
  },
  openGraph: {
    type: "website",
    url: "https://suite33.vercel.app",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Suite33",
      },
    ],
  },
  keywords: [
    "Business management",
    "Small business",
    "Finance tracking",
    "Staff performance",
    "Payroll",
    "AI insights",
    "data import/export",
    "business tools",
    "productivity application",
    "Suite 33",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={` ${interFont.className} antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <SpeedInsights />
            <Analytics />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
