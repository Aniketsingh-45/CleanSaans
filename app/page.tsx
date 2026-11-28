"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { AqiCard, ExposureComparison, ShareButton } from "@/components";
import {
  ArrowRightIcon,
  CameraIcon,
  LeafIcon,
  MicroscopeIcon,
  StethoscopeIcon,
  UserEditIcon,
} from "@/components/common/Icons";
import type { AqiResponse } from "@/lib/data/aqi";
import type { PlanResponse } from "@/lib/data/plan";
import { LanguageToggle, useT } from "@/lib/i18n";
import { loadProfile, useProfile } from "@/lib/profile";

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

  // Redirect to onboarding if no profile exists (with loadProfile fallback to prevent hydration race)
  useEffect(() => {
    if (!profile && !loadProfile()) {
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
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {/* 0) Skip to Content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-teal-900 focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
      >
        {t("skipToContent")}
      </a>

      {/* 1) Pure Website Full-Width Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xs">
        <div className="mx-auto max-w-7xl px-3.5 py-2.5 sm:px-6 sm:py-3.5 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
            {/* Top row on mobile / Left on desktop: Brand Identity */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-linear-to-br from-teal-700 to-emerald-800 text-white shadow-md shadow-teal-950/20">
                  <LeafIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h1 className="text-lg font-black tracking-tight text-slate-950 sm:text-2xl">
                      {t("appName")}
                    </h1>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-950">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                      Live Monitored
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs font-semibold text-teal-800">
                    {t("tagline")}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation & Language controls (Single instance in DOM, perfectly responsive) */}
            <nav
              aria-label="Quick actions"
              className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-3"
            >
              <Link
                href="/audit"
                className="flex-1 sm:flex-none inline-flex min-h-11 items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-teal-200/80 bg-teal-50/70 sm:border-slate-200/90 sm:bg-white px-2.5 sm:px-4 py-2 text-xs font-bold text-teal-950 sm:text-slate-800 shadow-2xs transition-all hover:bg-slate-50 hover:border-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                <CameraIcon className="h-4 w-4 text-teal-700 shrink-0" />
                <span>{t("auditNav")}</span>
              </Link>
              <Link
                href="/onboarding"
                className="flex-1 sm:flex-none inline-flex min-h-11 items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white px-2.5 sm:px-4 py-2 text-xs font-bold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 hover:border-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                <UserEditIcon className="h-4 w-4 text-teal-700 shrink-0" />
                <span>{t("editProfile")}</span>
              </Link>
              <LanguageToggle className="shrink-0" />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-3.5 py-4 sm:px-6 sm:py-8 space-y-5 sm:space-y-8"
      >
        {/* Tier 1: Twin Hero Metric Cards (Air Quality + Cigarette Exposure Reduction) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
          {/* Card 1: Live City AQI & CPCB Telemetry */}
          <div className="h-full">
            <AqiCard city={profile.city} onDataLoaded={setAqiData} />
          </div>

          {/* Card 2: Impact Simulation & Cigarette Reduction */}
          <div className="h-full">
            {planData ? (
              <ExposureComparison
                baseline={planData.baseline}
                plan={planData.plan}
                percentSaved={planData.percentSaved}
              />
            ) : planLoading ? (
              <section
                role="status"
                aria-label={t("planLoading")}
                className="h-full flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-teal-950/5 motion-reduce:animate-none animate-pulse sm:p-7"
              >
                <div>
                  <div className="h-5 w-40 rounded-full bg-slate-200" />
                  <div className="mt-3 h-7 w-64 rounded-xl bg-slate-200" />
                  <div className="mt-2 h-4 w-52 rounded-md bg-slate-200" />
                </div>
                <div className="my-6 space-y-4">
                  <div className="h-16 w-full rounded-2xl bg-slate-100" />
                  <div className="h-16 w-full rounded-2xl bg-slate-100" />
                </div>
                <div className="h-4 w-32 rounded-md bg-slate-200" />
                <span className="sr-only">{t("planLoading")}</span>
              </section>
            ) : planError ? (
              <section
                role="alert"
                aria-labelledby="plan-error-heading"
                className="h-full flex flex-col justify-between rounded-3xl border border-rose-200 bg-rose-50/70 p-6 shadow-xl shadow-teal-950/5 sm:p-7"
              >
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-100/80 px-3 py-0.5 text-xs font-bold text-rose-900">
                    Plan Error
                  </div>
                  <h2 id="plan-error-heading" className="mt-3 text-lg font-bold text-rose-950">
                    {planError}
                  </h2>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handlePlanRetry}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-rose-700 px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
                  >
                    {t("planRetry")}
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        </div>

        {/* Tier 2: 24-Hour Diurnal Safe Window Forecast */}
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

        {/* Tier 3: Personalized Daily Action Plan (Full-Width with Integrated Share Button) */}
        {planData && (
          <div className="content-visibility-auto">
            <DailyPlan
              actions={planData.actions}
              source={planData.source}
              headerRight={<ShareButton planData={planData} />}
            />
          </div>
        )}

        {/* Tier 4: AI Air Intelligence Hub (Vision AI Audit Lab + Ask CleanSaans AI) */}
        <div className="content-visibility-auto grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
          {/* Card A: Vision AI Photo Audit Lab (5 cols) */}
          <div className="lg:col-span-5 h-full">
            <section
              aria-labelledby="audit-banner-heading"
              className="relative overflow-hidden rounded-3xl border border-teal-900/10 bg-linear-to-br from-teal-50/90 via-emerald-50/60 to-white p-6 shadow-xl shadow-teal-950/5 backdrop-blur-md transition-all hover:border-teal-400 sm:p-7 h-full flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 border-b border-slate-100/80 pb-4">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-white/90 px-3 py-0.5 text-xs font-bold text-teal-900 shadow-2xs">
                    <CameraIcon className="h-3.5 w-3.5 text-teal-700" />
                    <span>Vision AI Lab</span>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                    Instant Camera Audit
                  </span>
                </div>

                <div className="mt-5">
                  <h2
                    id="audit-banner-heading"
                    className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl"
                  >
                    {t("auditHomeBannerTitle")}
                  </h2>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
                    {t("auditHomeBannerDesc")}
                  </p>
                </div>

                {/* Audit feature indicators */}
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-teal-100 bg-white/80 p-2.5 shadow-2xs">
                    <span className="block text-[11px] font-bold text-teal-900">
                      Rasoi Ka Dhuan
                    </span>
                    <span className="text-[10px] text-slate-500">Exhaust & gas leak</span>
                  </div>
                  <div className="rounded-xl border border-teal-100 bg-white/80 p-2.5 shadow-2xs">
                    <span className="block text-[11px] font-bold text-teal-900">Khidki & Gate</span>
                    <span className="text-[10px] text-slate-500">Seal gaps & cracks</span>
                  </div>
                  <div className="rounded-xl border border-teal-100 bg-white/80 p-2.5 shadow-2xs">
                    <span className="block text-[11px] font-bold text-teal-900">
                      Dhuan & Incense
                    </span>
                    <span className="text-[10px] text-slate-500">Agarbatti & coil</span>
                  </div>
                  <div className="rounded-xl border border-teal-100 bg-white/80 p-2.5 shadow-2xs">
                    <span className="block text-[11px] font-bold text-teal-900">
                      Ventilation Flow
                    </span>
                    <span className="text-[10px] text-slate-500">Taazi hawa index</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100/80">
                <Link
                  href="/audit"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-teal-800 to-teal-950 px-6 py-3 text-sm font-extrabold text-white shadow-md transition-all hover:-translate-y-0.5 hover:from-teal-900 hover:to-slate-950 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                >
                  <span>{t("auditHomeBannerBtn")}</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </div>

          {/* Card B: Ask CleanSaans AI Question Box (7 cols) */}
          <div className="lg:col-span-7 h-full">
            <AskBox className="h-full flex flex-col justify-between" />
          </div>
        </div>

        {/* Tier 5: Transparency & Scientific Methodology */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <button
            ref={assumptionsBtnRef}
            type="button"
            onClick={() => setIsAssumptionsOpen(true)}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-6 py-2.5 text-xs font-bold text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <MicroscopeIcon className="h-4 w-4 text-teal-700" />
            <span>{t("howCalculatedBtn")}</span>
          </button>

          {/* Safety Note */}
          <section
            aria-label={t("safetyNoteAria")}
            className="w-full max-w-3xl rounded-2xl border border-teal-200/80 bg-teal-50/80 p-4.5 text-xs font-medium text-teal-950 shadow-2xs"
          >
            <div className="flex items-start gap-3">
              <StethoscopeIcon className="h-5 w-5 text-teal-800 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{t("safetyNoteText")}</p>
            </div>
          </section>
        </div>
      </main>

      {/* Part (c): Footer Disclaimer & Semantic Landmark */}
      <footer
        role="contentinfo"
        className="mt-12 border-t border-slate-200/80 bg-white py-8 text-xs text-slate-600"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LeafIcon className="h-4 w-4 text-teal-700" />
            <span className="font-bold text-slate-800">CleanSaans</span>
          </div>
          <p className="text-center sm:text-right max-w-xl">{t("footerDisclaimer")}</p>
        </div>
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
