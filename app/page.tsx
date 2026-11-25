import type { JSX } from "react";

/**
 * Initial setup shell for CleanSaans.
 * Health and savings numbers will be connected exclusively from /lib/engine in upcoming steps.
 */
export default function HomePage(): JSX.Element {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between gap-4 border-b border-teal-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">CleanSaans</h1>
          <p className="text-sm font-medium text-teal-800">Saaf saans, sabke saath.</p>
        </div>
        <span className="inline-flex min-h-[44px] items-center rounded-full border border-teal-700/20 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900">
          Setup taiyaar
        </span>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-6 py-8">
        <section
          aria-labelledby="welcome-heading"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 id="welcome-heading" className="text-xl font-semibold text-slate-950">
            Namaste! CleanSaans mein aapka swagat hai.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-700">
            Yeh project setup shell hai. Agle steps mein live AQI, deterministic exposure engine aur
            parivar ke liye roz ka simple Hinglish plan joda jayega.
          </p>
        </section>

        <section
          aria-label="Safety note"
          className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-sm text-teal-950"
        >
          <p className="font-medium">
            Safety note: Saans lene mein dikkat ya seene mein dard ho to turant doctor se milein.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-200 pt-4 text-xs text-slate-600">
        CleanSaans: sirf jaankari ke liye, doctor ki salah nahi. Sabhi numbers approximate hain.
      </footer>
    </div>
  );
}
