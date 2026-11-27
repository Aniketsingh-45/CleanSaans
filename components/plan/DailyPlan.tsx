"use client";

import { useMemo, useState, type JSX } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  CigaretteIcon,
  ClockIcon,
  HomeIcon,
  RupeeIcon,
  SparklesIcon,
  SproutIcon,
} from "@/components/common/Icons";
import type { PlanAction } from "@/lib/data/plan";
import { useT, type TranslationKey } from "@/lib/i18n";

export interface DailyPlanProps {
  actions: readonly PlanAction[];
  source: "ai" | "rules";
  headerRight?: React.ReactNode;
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
export function DailyPlan({ actions, source, headerRight }: DailyPlanProps): JSX.Element {
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
      className="relative overflow-hidden rounded-3xl border border-teal-900/10 bg-white/95 p-6 shadow-xl shadow-teal-950/5 backdrop-blur-md transition-all sm:p-7"
    >
      {/* Background ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-linear-to-tl from-emerald-200/25 to-teal-200/15 blur-3xl"
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-slate-100/80 pb-5">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50/90 px-3 py-0.5 text-xs font-bold text-teal-900 shadow-2xs">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-600" />
            Personalized Daily Routine
          </div>
          <h2
            id="daily-plan-heading"
            className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl"
          >
            {t("planSectionTitle")}
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">{t("planSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {headerRight}

          {/* AI Polish vs Rules-based Badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-2xs ${
              source === "ai"
                ? "border-teal-300/80 bg-teal-50 text-teal-950"
                : "border-slate-300/80 bg-slate-100 text-slate-800"
            }`}
          >
            {source === "ai" ? (
              <>
                <SparklesIcon className="h-3.5 w-3.5 text-teal-800" />
                <span>{t("sourceAiBadge")}</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-3.5 w-3.5 text-slate-700" />
                <span>{t("sourceRulesBadge")}</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="relative mt-7 space-y-8">
        {(["routine", "indoor", "sustainable"] as const).map((categoryKey) => {
          const catActions = groupedActions[categoryKey];
          if (catActions.length === 0) return null;

          return (
            <div
              key={categoryKey}
              className="space-y-3.5 border-b border-slate-100/80 pb-7 last:border-b-0 last:pb-0"
            >
              <h3 className="flex items-center gap-2.5 text-xs font-black uppercase tracking-wider text-teal-950 sm:text-sm">
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-100/80 text-teal-900 shadow-2xs"
                >
                  {categoryKey === "routine" && <ClockIcon className="h-4 w-4" />}
                  {categoryKey === "indoor" && <HomeIcon className="h-4 w-4" />}
                  {categoryKey === "sustainable" && <SproutIcon className="h-4 w-4" />}
                </span>
                <span>{t(CATEGORY_TITLES[categoryKey])}</span>
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      className={`group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:border-teal-400 hover:shadow-md sm:p-6 ${
                        catActions.length === 1 ? "sm:col-span-2" : ""
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs">
                            <ClockIcon className="h-3 w-3 text-slate-500" />
                            <span>{action.time}</span>
                          </span>

                          {/* Free / Cost Badge */}
                          {action.impact.costInr === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-extrabold text-emerald-950 shadow-2xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                              {t("freeBadge")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-slate-300/80 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                              {t("costBadge", { cost: action.impact.costInr })}
                            </span>
                          )}
                        </div>

                        <h4 className="mt-3.5 text-base font-extrabold text-slate-950 sm:text-lg">
                          {action.title}
                        </h4>

                        {/* Impact Chips */}
                        <div className="mt-3.5 flex flex-wrap items-center gap-2">
                          {cigsSavedText && (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200/80 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-950 shadow-2xs">
                              <CigaretteIcon className="h-3.5 w-3.5 text-teal-800" />
                              <span>{t("cigsSavedChip", { cigs: cigsSavedText })}</span>
                            </span>
                          )}

                          {action.impact.inrSaved > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-950 shadow-2xs">
                              <RupeeIcon className="h-3.5 w-3.5 text-emerald-800" />
                              <span>{t("inrSavedChip", { inr: action.impact.inrSaved })}</span>
                            </span>
                          )}

                          {action.impact.co2KgSaved > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200/80 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-950 shadow-2xs">
                              <SproutIcon className="h-3.5 w-3.5 text-sky-800" />
                              <span>{t("co2SavedChip", { co2: action.impact.co2KgSaved })}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expandable "Kyun?" Button */}
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-controls={whyId}
                          onClick={() => toggleExpand(action.id)}
                          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-2.5 text-xs font-bold text-teal-800 transition-colors hover:text-teal-950 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                        >
                          <span>{t("kyunBtn")}</span>
                          <ChevronDownIcon
                            className={`h-3.5 w-3.5 transform transition-transform duration-200 motion-reduce:transition-none ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {/* Collapsible panel with action.why */}
                        {isExpanded && (
                          <div
                            id={whyId}
                            className="mt-2.5 rounded-xl border border-teal-100 bg-teal-50/50 p-3.5 text-xs font-medium leading-relaxed text-slate-800 shadow-2xs"
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
