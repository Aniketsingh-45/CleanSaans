"use client";

import { useState, type JSX } from "react";
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
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 id="comparison-heading" className="text-lg font-bold text-slate-950 sm:text-xl">
            {t("comparisonTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{t("comparisonSubtitle")}</p>
        </div>

        {/* Toggle between Baseline and Plan view */}
        <button
          type="button"
          role="switch"
          aria-checked={showWithPlan}
          onClick={() => setShowWithPlan((prev) => !prev)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          <span>{t("comparisonToggleLabel")}</span>
          <span
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors motion-reduce:transition-none ${
              showWithPlan ? "bg-teal-700" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform motion-reduce:transition-none ${
                showWithPlan ? "translate-x-4.5" : "translate-x-1"
              }`}
            />
          </span>
        </button>
      </div>

      <div className="mt-6 space-y-5">
        {/* Baseline Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden="true" />
              {t("withoutPlanLabel")}
            </span>
            <span className="font-extrabold text-slate-900">
              {t("cigsPerDay", { low: baseline.low, high: baseline.high })}
            </span>
          </div>
          <div className="mt-2 h-6 w-full overflow-hidden rounded-lg bg-slate-100 p-0.5">
            <div
              style={{ width: "100%" }}
              className="h-full rounded-md bg-rose-500 transition-all duration-700 motion-reduce:transition-none"
            />
          </div>
        </div>

        {/* Plan Bar with Animated Drop */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-600" aria-hidden="true" />
              {t("withPlanLabel")}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-teal-900">
                {t("cigsPerDay", { low: plan.low, high: plan.high })}
              </span>
              <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-950">
                {t("percentSavedBadge", { percent: percentSaved })}
              </span>
            </div>
          </div>
          <div className="mt-2 h-6 w-full overflow-hidden rounded-lg bg-slate-100 p-0.5">
            <div
              style={{ width: showWithPlan ? `${planWidthPercent}%` : "100%" }}
              className={`h-full rounded-md transition-all duration-700 ease-out motion-reduce:transition-none ${
                showWithPlan ? "bg-teal-600" : "bg-slate-400 opacity-60"
              }`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
