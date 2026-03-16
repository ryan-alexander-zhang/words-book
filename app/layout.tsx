import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans"
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "Words Book",
  description: "A focused vocabulary workspace with embedded pronunciation practice."
};

export const viewport: Viewport = {
  themeColor: "#ffffff"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-50 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only"
        >
          Skip to main content
        </a>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
