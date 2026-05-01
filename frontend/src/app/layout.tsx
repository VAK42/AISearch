import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin", "vietnamese"] });
export const metadata: Metadata = {
  title: "AI",
  description: "AI",
};
export default function rootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${inter.className} h-full`}>
      <body className="h-full bg-white text-green-950">{children}</body>
    </html>
  )
}