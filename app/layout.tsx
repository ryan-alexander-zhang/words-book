import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import React from "react";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Words Book",
  description: "A focused vocabulary workspace with embedded pronunciation practice."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
