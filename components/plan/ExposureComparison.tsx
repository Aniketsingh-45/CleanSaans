"use client";

import { useState, type JSX } from "react";
import { SparklesIcon } from "@/components/common/Icons";
import { useT } from "@/lib/i18n";

export interface ExposureComparisonProps {
  baseline: { low: number; high: number };
  plan: { low: number; high: number };
  percentSaved: number;
}

/**
 * "Bina plan vs Plan ke saath" comparison component.
 * Displays:
 * - Two comparative cigarette exposure range bars
 * - "~X% kam dhuan" badge
 * - Interactive toggle animating the exposure reduction
 * - Respects prefers-reduced-motion
 */
export function ExposureComparison({
  baseline,
  plan,
  percentSaved,
}: ExposureComparisonProps): JSX.Element {
  const { t } = useT();
  const [showWithPlan, setShowWithPlan] = useState<boolean>(true);

  // Baseline is 100% width; plan bar drops proportionally to percentSaved
  const planWidthPercent = Math.max(15, Math.min(100, Math.round(100 - percentSaved)));

  return (
    <section
      aria-labelledby="comparison-heading"
      className="relative overflow-hidden rounded-3xl border border-teal-900/10 bg-white/95 p-4.5 sm:p-6 lg:p-7 shadow-xl shadow-teal-950/5 backdrop-blur-md transition-all h-full flex flex-col justify-between"
    >
      {/* Luminous atmospheric orb */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-linear-to-br from-teal-200/25 to-cyan-200/15 blur-3xl"
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-slate-100/80 pb-5">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50/90 px-3 py-0.5 text-xs font-bold text-teal-900 shadow-2xs">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-600" />
            Impact Engine Simulation
          </div>
          <h2
            id="comparison-heading"
            className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl"
          >
            {t("comparisonTitle")}
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">{t("comparisonSubtitle")}</p>
        </div>

        {/* Toggle between Baseline and Plan view */}
        <button
          type="button"
          role="switch"
          aria-checked={showWithPlan}
          onClick={() => setShowWithPlan((prev) => !prev)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/90 px-4 py-2 text-xs font-bold text-slate-800 shadow-xs transition-all hover:bg-slate-100 hover:border-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          <span>{t("comparisonToggleLabel")}</span>
          <span
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 motion-reduce:transition-none ${
              showWithPlan ? "bg-teal-700 shadow-inner" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition-transform duration-300 motion-reduce:transition-none ${
                showWithPlan ? "translate-x-5.5" : "translate-x-1"
              }`}
            />
          </span>
        </button>
      </div>

      <div className="relative mt-6 space-y-6">
        {/* Baseline Bar */}
        <div className="rounded-2xl border border-rose-100/80 bg-linear-to-r from-rose-50/40 via-white to-transparent p-4 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500 shadow-xs" aria-hidden="true" />
              <span className="text-sm font-bold text-slate-900">{t("withoutPlanLabel")}</span>
            </span>
            <span className="rounded-lg bg-rose-100/90 px-2.5 py-1 text-xs font-extrabold text-rose-950">
              {t("cigsPerDay", { low: baseline.low, high: baseline.high })}
            </span>
          </div>
          <div className="mt-3 h-7 w-full overflow-hidden rounded-xl bg-slate-100/90 p-1 shadow-inner">
            <div
              style={{ width: "100%" }}
              className="h-full rounded-lg bg-linear-to-r from-rose-500 via-rose-600 to-red-600 shadow-sm transition-all duration-700 motion-reduce:transition-none"
            />
          </div>
        </div>

        {/* Plan Bar with Animated Drop */}
        <div className="rounded-2xl border border-teal-100/80 bg-linear-to-r from-teal-50/40 via-white to-transparent p-4 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-teal-600 shadow-xs" aria-hidden="true" />
              <span className="text-sm font-bold text-slate-900">{t("withPlanLabel")}</span>
            </span>
            <div className="flex items-center gap-2.5">
              <span className="rounded-lg bg-teal-100/90 px-2.5 py-1 text-xs font-extrabold text-teal-950">
                {t("cigsPerDay", { low: plan.low, high: plan.high })}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/80 bg-emerald-100/90 px-3 py-1 text-xs font-black text-emerald-950 shadow-2xs">
                <SparklesIcon className="h-3.5 w-3.5 text-emerald-800" />
                <span>{t("percentSavedBadge", { percent: percentSaved })}</span>
              </span>
            </div>
          </div>
          <div className="mt-3 h-7 w-full overflow-hidden rounded-xl bg-slate-100/90 p-1 shadow-inner">
            <div
              style={{ width: showWithPlan ? `${planWidthPercent}%` : "100%" }}
              className={`h-full rounded-lg transition-all duration-700 ease-out motion-reduce:transition-none ${
                showWithPlan
                  ? "bg-linear-to-r from-teal-500 via-teal-600 to-emerald-600 shadow-sm"
                  : "bg-slate-400 opacity-60"
              }`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
