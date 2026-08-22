import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dayflow | Modern Human Resource Management System",
  description: "Every workday, perfectly aligned. Digitize profile management, leave approvals, attendance tracking, and payroll calculations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
        <Toaster position="top-right" theme="dark" closeButton richColors />
      </body>
    </html>
  );
}
