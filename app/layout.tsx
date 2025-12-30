import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cloud Armor Command Center | Security Dashboard",
  description: "Enterprise security dashboard for Google Cloud Armor policies. Monitor WAF rules, attack vectors, and security posture across all GCP projects.",
  keywords: ["Cloud Armor", "WAF", "Security", "GCP", "Google Cloud", "SIEM"],
  authors: [{ name: "Security Team" }],
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-900 text-slate-50`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
