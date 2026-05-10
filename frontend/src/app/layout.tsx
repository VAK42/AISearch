import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import "highlight.js/styles/github.css";
import "katex/dist/katex.min.css";
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