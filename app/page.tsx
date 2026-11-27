"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { AqiCard, ExposureComparison, ShareButton } from "@/components";
import type { AqiResponse } from "@/lib/data/aqi";
import type { PlanResponse } from "@/lib/data/plan";
import { LanguageToggle, useT } from "@/lib/i18n";
import { useProfile } from "@/lib/profile";

// Lazy-load heavy components for performance & fast FCP
const SafeWindow = dynamic(
  () => import("@/components/aqi/SafeWindow").then((mod) => mod.SafeWindow),
  {
    loading: () => (
      <div className="h-64 w-full animate-pulse motion-reduce:animate-none rounded-2xl border border-slate-200 bg-white p-6 shadow-xs" />
    ),
  }
);

const DailyPlan = dynamic(
  () => import("@/components/plan/DailyPlan").then((mod) => mod.DailyPlan),
  {
    loading: () => (
      <div className="h-72 w-full animate-pulse motion-reduce:animate-none rounded-2xl border border-slate-200 bg-white p-6 shadow-xs" />
    ),
  }
);

const AskBox = dynamic(() => import("@/components/AskBox").then((mod) => mod.AskBox), {
  loading: () => (
    <div className="h-44 w-full animate-pulse motion-reduce:animate-none rounded-2xl border border-slate-200 bg-white p-6 shadow-xs" />
  ),
});

const AssumptionsModal = dynamic(
  () => import("@/components/assumptions/AssumptionsModal").then((mod) => mod.AssumptionsModal),
  { ssr: false }
);

/**
 * Real CleanSaans Home Page:
 * Part (a):
 * 1) Header: CleanSaans + tagline + LanguageToggle + "Profile badlein" link
 * 2) AQI Card: Live city AQI, CPCB text label, relative time, cached badge, retry, skeleton
 * 3) SafeWindow: 24-hr bar timeline, sr-only table, start time/duration controls, live engine calculation,
 *    "Best time set karo" button, aria-live polite region, sensitive warning chip.
 *
 * Part (b):
 * 1) Call /api/plan with profile + chosenStartHour and durationHours (debounced 400ms, stale cancellation).
 * 2) "Bina plan vs Plan ke saath": comparison range bars, animated drop toggle (motion-reduce safe).
 * 3) "Aaj ka plan": 5 action cards grouped into 3 sections, free-first, impact chips, expandable "Kyun?".
 * 4) Skeletons and friendly error states with retry.
 */
export default function HomePage(): JSX.Element {
  const router = useRouter();
  const { t } = useT();
  const profile = useProfile();

  const [aqiData, setAqiData] = useState<AqiResponse | null>(null);

  // SafeWindow controls state shared with /api/plan
  const [startHour, setStartHour] = useState<number>(7);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  // Plan API state
  const [planData, setPlanData] = useState<PlanResponse | null>(null);
  const [planLoading, setPlanLoading] = useState<boolean>(true);
  const [planError, setPlanError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0);

  // Assumptions modal state & trigger reference
  const [isAssumptionsOpen, setIsAssumptionsOpen] = useState<boolean>(false);
  const assumptionsBtnRef = useRef<HTMLButtonElement>(null);

  // Redirect to onboarding if no profile exists
  useEffect(() => {
    if (!profile) {
      router.replace("/onboarding");
    }
  }, [profile, router]);

  // Debounced call to /api/plan (400ms) with stale cancellation via AbortController
  useEffect(() => {
    if (!profile) return;

    const controller = new AbortController();
    const durationHours = Math.max(0.5, Math.min(3, durationMinutes / 60));

    const timeoutId = setTimeout(async () => {
      setPlanLoading(true);
      setPlanError(null);
      try {
        const payload = {
          city: profile.city,
          kids: profile.kids > 0,
          elderly: profile.elderly > 0,
          asthma: profile.asthma,
          commuteMode: profile.commuteMode,
          commuteKm: profile.commuteKm,
          windows: profile.windows,
          purifier: profile.purifier ? "yes" : "no",
          cooking: profile.cooking,
          chosenStartHour: startHour,
          durationHours,
        };

        const res = await fetch("/api/plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Plan API error (status ${res.status})`);
        }

        const data: PlanResponse = await res.json();
        setPlanData(data);
        setPlanError(null);
        setPlanLoading(false);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // Stale request aborted; do not show error
          return;
        }
        setPlanError(t("planError"));
        setPlanLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [profile, startHour, durationMinutes, retryKey, t]);

  const handlePlanRetry = useCallback(() => {
    setPlanLoading(true);
    setPlanError(null);
    setRetryKey((k) => k + 1);
  }, []);

  if (!profile) {
    return (
      <div
        role="status"
        aria-label="Loading"
        className="flex min-h-screen items-center justify-center bg-slate-50"
      >
        <span className="text-sm font-medium text-slate-500">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6 sm:px-6">
      {/* 0) Skip to Content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-teal-900 focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
      >
        {t("skipToContent")}
      </a>

      {/* 1) Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {t("appName")}
          </h1>
          <p className="text-sm font-medium text-teal-800">{t("tagline")}</p>
        </div>

        <nav aria-label="Quick actions" className="flex flex-wrap items-center gap-3">
          <Link
            href="/audit"
            className="inline-flex min-h-11 items-center rounded-xl border border-teal-700/20 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 transition-colors hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            📸 {t("auditNav")}
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex min-h-11 items-center rounded-xl border border-teal-700/20 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 transition-colors hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            ✏️ {t("editProfile")}
          </Link>
          <LanguageToggle />
        </nav>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 space-y-6 py-6">
        {/* 2) AQI Card */}
        <AqiCard city={profile.city} onDataLoaded={setAqiData} />

        {/* 3) SafeWindow Component */}
        {aqiData?.hourly && aqiData.hourly.length > 0 && (
          <SafeWindow
            hourly={aqiData.hourly}
            profile={profile}
            startHour={startHour}
            onStartHourChange={setStartHour}
            durationMinutes={durationMinutes}
            onDurationMinutesChange={setDurationMinutes}
          />
        )}

        {/* Part (b): Plan Loading Skeleton */}
        {planLoading && !planData && (
          <section
            role="status"
            aria-label={t("planLoading")}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs motion-reduce:animate-none animate-pulse"
          >
            <div className="h-6 w-48 rounded-md bg-slate-200" />
            <div className="h-4 w-64 rounded-md bg-slate-200" />
            <div className="mt-4 h-16 w-full rounded-xl bg-slate-100" />
            <div className="h-16 w-full rounded-xl bg-slate-100" />
            <div className="h-16 w-full rounded-xl bg-slate-100" />
            <span className="sr-only">{t("planLoading")}</span>
          </section>
        )}

        {/* Part (b): Plan Error State with Retry */}
        {planError && !planLoading && (
          <section
            role="alert"
            aria-labelledby="plan-error-heading"
            className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6 shadow-xs"
          >
            <h2 id="plan-error-heading" className="text-base font-semibold text-rose-950">
              {planError}
            </h2>
            <button
              type="button"
              onClick={handlePlanRetry}
              className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
            >
              {t("planRetry")}
            </button>
          </section>
        )}

        {/* Part (b): Exposure Comparison ("Bina plan vs Plan ke saath") */}
        {planData && (
          <ExposureComparison
            baseline={planData.baseline}
            plan={planData.plan}
            percentSaved={planData.percentSaved}
          />
        )}

        {/* Share Button for the current plan */}
        {planData && (
          <div className="flex justify-end">
            <ShareButton planData={planData} />
          </div>
        )}

        {/* Part (b): Daily Plan ("Aaj ka plan" with 3 sections & 5 actions) */}
        {planData && <DailyPlan actions={planData.actions} source={planData.source} />}

        {/* Part (c): "Ye numbers kaise nikle?" Button */}
        <div className="flex justify-center pt-2">
          <button
            ref={assumptionsBtnRef}
            type="button"
            onClick={() => setIsAssumptionsOpen(true)}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <span aria-hidden="true">ℹ️</span>
            <span>{t("howCalculatedBtn")}</span>
          </button>
        </div>

        {/* Air Audit Banner Link */}
        <section
          aria-labelledby="audit-banner-heading"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50/80 to-emerald-50/80 p-5 shadow-xs"
        >
          <div className="max-w-md">
            <h2 id="audit-banner-heading" className="text-base font-bold text-teal-950 sm:text-lg">
              📸 {t("auditHomeBannerTitle")}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-teal-900 sm:text-sm">
              {t("auditHomeBannerDesc")}
            </p>
          </div>
          <Link
            href="/audit"
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-teal-900 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-teal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            {t("auditHomeBannerBtn")} →
          </Link>
        </section>

        {/* Ask CleanSaans AI Question Box */}
        <AskBox />

        {/* Safety Note */}
        <section
          aria-label={t("safetyNoteAria")}
          className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-xs font-medium text-teal-950"
        >
          <p>{t("safetyNoteText")}</p>
        </section>
      </main>

      {/* Part (c): Footer Disclaimer & Semantic Landmark */}
      <footer
        role="contentinfo"
        className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-600"
      >
        <p>{t("footerDisclaimer")}</p>
      </footer>

      {/* Part (c): Accessible Assumptions Modal */}
      <AssumptionsModal
        isOpen={isAssumptionsOpen}
        onClose={() => setIsAssumptionsOpen(false)}
        triggerRef={assumptionsBtnRef}
      />
    </div>
  );
}
