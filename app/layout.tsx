import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ServiceWorkerRegister } from "@/components";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f766e",
};

export const metadata: Metadata = {
  title: {
    default: "CleanSaans - Saaf saans, sabke saath",
    template: "%s | CleanSaans",
  },
  description:
    "CleanSaans: Saaf saans, sabke saath. Mobile-first winter smog assistant for Indian families. Live AQI, deterministic cigarette exposure calculation, cleanest outdoor windows, and daily personal plans.",
  keywords: [
    "CleanSaans",
    "AQI India",
    "Air Pollution",
    "PM2.5",
    "Winter Smog",
    "Delhi AQI",
    "Clean Air",
    "Air Purifier",
    "N95 Mask",
  ],
  authors: [{ name: "CleanSaans Team" }],
  openGraph: {
    title: "CleanSaans - Saaf saans, sabke saath",
    description:
      "Mobile-first winter smog assistant for Indian families. Live AQI, deterministic cigarette exposure calculation, and daily personal plans.",
    type: "website",
    locale: "en_IN",
    siteName: "CleanSaans",
  },
  twitter: {
    card: "summary_large_image",
    title: "CleanSaans - Saaf saans, sabke saath",
    description:
      "Mobile-first winter smog assistant for Indian families. Live AQI, deterministic cigarette exposure calculation, and daily personal plans.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CleanSaans",
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

/**
 * Root App Router layout for CleanSaans.
 * Sets semantic document structure, internationalization provider, and accessible focus defaults.
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="relative min-h-screen bg-clean-mesh bg-slate-50 text-slate-900 antialiased selection:bg-teal-200 selection:text-slate-950">
        {/* Ambient Aurora glow orbs for wide desktop & laptop screens */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[54rem] rounded-full bg-linear-to-tr from-teal-400/20 via-emerald-300/15 to-cyan-400/20 blur-3xl opacity-80" />
          <div className="hidden lg:block absolute top-[25rem] -left-20 h-96 w-96 rounded-full bg-teal-500/12 blur-3xl" />
          <div className="hidden lg:block absolute top-[40rem] -right-20 h-96 w-96 rounded-full bg-emerald-500/12 blur-3xl" />
          <div className="hidden xl:block absolute top-[70rem] left-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>
        <ServiceWorkerRegister />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
