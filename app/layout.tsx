import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SidebarLayout from "@/components/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "1st Option POS — Energy Mart",
  description: "Point of Sale, Inventory Management & Sales Tracking for 1st Option Energy Mart",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-screen bg-slate-50 font-[var(--font-inter)]">
        <SidebarLayout>{children}</SidebarLayout>
      </body>
    </html>
  );
}
