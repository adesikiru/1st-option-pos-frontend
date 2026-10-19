import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

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
      <body className="min-h-screen flex flex-col bg-slate-50 font-[var(--font-inter)]">
        <Header />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
