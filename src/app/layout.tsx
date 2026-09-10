import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "ol/ol.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoordPoint — Konversi Koordinat DMS ⇄ DD & Peta OpenLayers",
  description:
    "Aplikasi pemetaan OpenLayers untuk mengubah koordinat DMS (Degree, Minutes, Seconds) menjadi DD (Decimal Degrees) dan sebaliknya, lengkap dengan marker interaktif, validasi, dan dokumentasi perancangan.",
  keywords: [
    "OpenLayers",
    "DMS",
    "Decimal Degrees",
    "Konversi Koordinat",
    "GIS",
    "OpenStreetMap",
    "React",
    "TypeScript",
    "Jest",
  ],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "CoordPoint — Konversi Koordinat DMS ⇄ DD",
    description:
      "Aplikasi pemetaan OpenLayers untuk konversi koordinat DMS ⇄ DD dengan marker interaktif.",
    siteName: "CoordPoint",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
