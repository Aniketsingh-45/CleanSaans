import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CleanSaans",
  description:
    "CleanSaans: Saaf saans, sabke saath. Sardiyon ke smog mein parivar ke liye saaf hawa aur roz ke asaan kadam.",
};

interface RootLayoutProps {
  children: ReactNode;
}

/**
 * Root App Router layout for CleanSaans.
 * Sets semantic document structure and accessible focus defaults.
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-teal-200 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
