"use client";

import type { JSX } from "react";
import { LanguageToggle, useT } from "@/lib/i18n";

/**
 * Initial setup shell for CleanSaans.
 * All visible strings consume the typed i18n dictionary via useT().
 */
export default function HomePage(): JSX.Element {
  const { t } = useT();

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">{t("appName")}</h1>
          <p className="text-sm font-medium text-teal-800">{t("tagline")}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex min-h-11 items-center rounded-full border border-teal-700/20 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900">
            {t("setupReady")}
          </span>
          <LanguageToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-6 py-8">
        <section
          aria-labelledby="welcome-heading"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 id="welcome-heading" className="text-xl font-semibold text-slate-950">
            {t("welcomeHeading")}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-700">{t("welcomeText")}</p>
        </section>

        <section
          aria-label={t("safetyNoteAria")}
          className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-sm text-teal-950"
        >
          <p className="font-medium">{t("safetyNoteText")}</p>
        </section>
      </main>

      <footer className="border-t border-slate-200 pt-4 text-xs text-slate-600">
        {t("footerDisclaimer")}
      </footer>
    </div>
  );
}
