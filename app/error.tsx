"use client";

import { useEffect, type JSX } from "react";
import { AlertTriangleIcon } from "@/components/common/Icons";

export interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root Client Error Boundary for CleanSaans.
 * Catches unhandled runtime exceptions with accessible recovery options.
 */
export default function GlobalError({ error, reset }: ErrorBoundaryProps): JSX.Element {
  useEffect(() => {
    // Zero-logging policy: Never log sensitive parameters or tokens to external telemetry
  }, [error]);

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center"
    >
      <div
        role="alert"
        aria-live="assertive"
        className="max-w-md rounded-2xl border border-rose-200 bg-white p-8 shadow-xs"
      >
        <AlertTriangleIcon className="h-10 w-10 text-rose-600 mx-auto" />
        <h1 className="mt-4 text-xl font-bold tracking-tight text-rose-950 sm:text-2xl">
          Kuch Garbar Hui
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Application load karte waqt unexpected error aaya. Kripya dobara koshish karein.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-teal-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-teal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            Dobara Koshish Karein
          </button>
        </div>
      </div>
    </main>
  );
}
