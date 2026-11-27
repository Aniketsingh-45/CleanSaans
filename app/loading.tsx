import type { JSX } from "react";

/**
 * Root Loading Skeleton for CleanSaans App Router.
 */
export default function RootLoading(): JSX.Element {
  return (
    <div
      role="status"
      aria-label="Loading application..."
      className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6 sm:px-6"
    >
      <header className="flex animate-pulse motion-reduce:animate-none items-center justify-between border-b border-teal-100 pb-4">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded-lg bg-slate-200" />
          <div className="h-4 w-48 rounded-md bg-slate-100" />
        </div>
        <div className="h-10 w-24 rounded-full bg-slate-200" />
      </header>

      <main id="main-content" className="mt-6 space-y-6">
        <div className="h-48 w-full animate-pulse motion-reduce:animate-none rounded-2xl border border-slate-200 bg-white p-6 shadow-xs" />
        <div className="h-64 w-full animate-pulse motion-reduce:animate-none rounded-2xl border border-slate-200 bg-white p-6 shadow-xs" />
      </main>
      <span className="sr-only">Loading application...</span>
    </div>
  );
}
