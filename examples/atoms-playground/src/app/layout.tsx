import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Morph Playground",
  description: "Test Morph's connectors in a sandbox environment",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body
        className={`${inter.className} bg-[#FCFCFC] dark:bg-[#090D0D] min-h-screen m-0 p-0`}
      >
        <ThemeProvider />
        {children}
      </body>
    </html>
  );
}
