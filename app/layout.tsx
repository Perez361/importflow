import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground min-h-screen relative`}
      >
        {/* Global gradient background */}
        <div className="fixed inset-0 mesh-gradient-light dark:mesh-gradient-dark -z-10" />
        
        {/* Gradient orbs for ambient effect */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="gradient-orb gradient-orb-1 top-[10%] left-[5%]" />
          <div className="gradient-orb gradient-orb-2 top-[40%] right-[10%]" />
          <div className="gradient-orb gradient-orb-3 bottom-[20%] left-[20%]" />
        </div>
        
        {children}
        <Analytics />
      </body>
    </html>
  );
}
