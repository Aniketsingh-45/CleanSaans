"use client";

import { useMemo, useState, type JSX } from "react";
import type { PlanAction } from "@/lib/data/plan";
import { useT, type TranslationKey } from "@/lib/i18n";

export interface DailyPlanProps {
  actions: readonly PlanAction[];
  source: "ai" | "rules";
}

const CATEGORY_TITLES: Record<"routine" | "indoor" | "sustainable", TranslationKey> = {
  routine: "categoryRoutine",
  indoor: "categoryIndoor",
  sustainable: "categorySustainable",
};

/**
 * "Aaj ka plan" component:
 * - 5 actions grouped into three distinct sections:
 *   1) Low-emission daily routines
 *   2) Indoor air quality hacks
 *   3) Sustainable alternatives
 * - Free/low-cost actions appear first (sorted by costInr ascending)
 * - Each card displays time, title, impact chips (cigarettes, INR, CO2, Free/Cost)
 * - Expandable accessible "Kyun?" button with aria-expanded
 * - Source badge for 'ai' vs 'rules'
 */
export function DailyPlan({ actions, source }: DailyPlanProps): JSX.Element {
  const { t } = useT();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Group actions by category and sort free/low-cost first within each group
  const groupedActions = useMemo(() => {
    const categories: Array<"routine" | "indoor" | "sustainable"> = [
      "routine",
      "indoor",
      "sustainable",
    ];

    const result: Record<"routine" | "indoor" | "sustainable", PlanAction[]> = {
      routine: [],
      indoor: [],
      sustainable: [],
    };

    for (const action of actions) {
      if (result[action.category]) {
        result[action.category].push(action);
      }
    }

    // Sort free/low-cost first in each category
    for (const cat of categories) {
      result[cat].sort((a, b) => (a.impact.costInr ?? 0) - (b.impact.costInr ?? 0));
    }

    return result;
  }, [actions]);

  return (
    <section
      aria-labelledby="daily-plan-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 id="daily-plan-heading" className="text-lg font-bold text-slate-950 sm:text-xl">
            {t("planSectionTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{t("planSubtitle")}</p>
        </div>

        {/* AI Polish vs Rules-based Badge */}
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            source === "ai"
              ? "border-teal-300 bg-teal-50 text-teal-900"
              : "border-slate-300 bg-slate-100 text-slate-800"
          }`}
        >
          {source === "ai" ? `✨ ${t("sourceAiBadge")}` : `📋 ${t("sourceRulesBadge")}`}
        </span>
      </div>

      <div className="mt-6 space-y-8">
        {(["routine", "indoor", "sustainable"] as const).map((categoryKey) => {
          const catActions = groupedActions[categoryKey];
          if (catActions.length === 0) return null;

          return (
            <div key={categoryKey} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-teal-900">
                {t(CATEGORY_TITLES[categoryKey])}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {catActions.map((action) => {
                  const isExpanded = !!expandedIds[action.id];
                  const whyId = `why-${action.id}`;

                  const cigsSavedText =
                    action.impact.cigsSavedHigh > 0
                      ? action.impact.cigsSavedLow === action.impact.cigsSavedHigh
                        ? `${action.impact.cigsSavedHigh}`
                        : `${action.impact.cigsSavedLow}-${action.impact.cigsSavedHigh}`
                      : null;

                  return (
                    <article
                      key={action.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-all hover:border-slate-300 sm:p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                          ⏰ {action.time}
                        </span>

                        {/* Free / Cost Badge */}
                        {action.impact.costInr === 0 ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-950">
                            {t("freeBadge")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                            {t("costBadge", { cost: action.impact.costInr })}
                          </span>
                        )}
                      </div>

                      <h4 className="mt-3 text-base font-bold text-slate-950 sm:text-lg">
                        {action.title}
                      </h4>

                      {/* Impact Chips */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {cigsSavedText && (
                          <span className="inline-flex items-center rounded-lg bg-teal-100/80 px-2.5 py-1 text-xs font-semibold text-teal-950">
                            🚬 {t("cigsSavedChip", { cigs: cigsSavedText })}
                          </span>
                        )}

                        {action.impact.inrSaved > 0 && (
                          <span className="inline-flex items-center rounded-lg bg-emerald-100/80 px-2.5 py-1 text-xs font-semibold text-emerald-950">
                            💰 {t("inrSavedChip", { inr: action.impact.inrSaved })}
                          </span>
                        )}

                        {action.impact.co2KgSaved > 0 && (
                          <span className="inline-flex items-center rounded-lg bg-sky-100/80 px-2.5 py-1 text-xs font-semibold text-sky-950">
                            🌱 {t("co2SavedChip", { co2: action.impact.co2KgSaved })}
                          </span>
                        )}
                      </div>

                      {/* Expandable "Kyun?" Button */}
                      <div className="mt-4 border-t border-slate-200/60 pt-3">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-controls={whyId}
                          onClick={() => toggleExpand(action.id)}
                          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-xs font-bold text-teal-900 transition-colors hover:text-teal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-md px-1"
                        >
                          <span>{t("kyunBtn")}</span>
                          <span
                            aria-hidden="true"
                            className={`transform transition-transform motion-reduce:transition-none ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          >
                            ▼
                          </span>
                        </button>

                        {/* Collapsible panel with action.why */}
                        {isExpanded && (
                          <div
                            id={whyId}
                            className="mt-2 rounded-lg bg-white p-3.5 text-sm leading-relaxed text-slate-700 shadow-2xs border border-slate-100"
                          >
                            <p>{action.why}</p>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
