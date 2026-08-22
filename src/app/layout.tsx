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
    <html lang="en" className={`${outfit.variable} ${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              })()
            `,
          }}
        />
      </head>
      <body className="min-h-full font-sans antialiased flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
        <Toaster position="top-right" theme="system" closeButton richColors />
      </body>
    </html>
  );
}
