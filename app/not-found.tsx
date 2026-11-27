import type { Metadata } from "next";
import Link from "next/link";
import type { JSX } from "react";

export const metadata: Metadata = {
  title: "404 - Page Not Found | CleanSaans",
  description: "Yeh page uplabdh nahi hai (Page not found).",
};

/**
 * Accessible 404 page for CleanSaans.
 */
export default function NotFound(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
        <span className="text-4xl" aria-hidden="true">
          🍃
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          404 - Page Nahi Mila
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Yeh page exist nahi karta ya hata diya gaya hai. Kripya mukhya page par wapas jayein.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-teal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            ← Home Par Wapas Jayein
          </Link>
        </div>
      </div>
    </main>
  );
}
