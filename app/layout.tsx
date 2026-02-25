import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ImportFlow PRO - Manage Your Import Business",
    template: "%s | ImportFlow PRO",
  },
  description: "ImportFlow PRO helps importers in Ghana and across Africa manage products, track shipments, process orders, and grow their business with powerful yet simple tools.",
  keywords: ["import management", "Ghana", "Africa", "inventory", "shipments", "orders", "business"],
  authors: [{ name: "ImportFlow" }],
  creator: "ImportFlow",
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://importflow.pro",
    siteName: "ImportFlow PRO",
    title: "ImportFlow PRO - Manage Your Importation Business",
    description: "ImportFlow PRO helps importers in Ghana and across Africa manage products, track shipments, process orders, and grow their business.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ImportFlow PRO - Manage Your Importation Business",
    description: "ImportFlow PRO helps importers in Ghana and across Africa manage products, track shipments, process orders, and grow their business.",
  },
  robots: {
    index: true,
    follow: true,
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
