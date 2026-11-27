"use client";

import { useEffect, useState, type JSX } from "react";
import { AlertTriangleIcon, MapPinIcon, RefreshIcon } from "@/components/common/Icons";
import type { AqiResponse } from "@/lib/data/aqi";
import type { CityName } from "@/lib/data/cities";
import type { CpcbCategoryLabel } from "@/lib/data/cpcb";
import { useT, type TranslationKey } from "@/lib/i18n";

export interface AqiCardProps {
  city: CityName;
  onDataLoaded?: (data: AqiResponse) => void;
}

const CATEGORY_STYLES: Record<
  CpcbCategoryLabel,
  { badge: string; text: string; glow: string; stroke: string; aura: string }
> = {
  Good: {
    badge: "bg-emerald-50 text-emerald-950 border-emerald-300 shadow-xs shadow-emerald-500/10",
    text: "text-emerald-700",
    glow: "bg-emerald-500",
    stroke: "#10b981",
    aura: "from-emerald-500/10 via-teal-500/5 to-transparent",
  },
  Satisfactory: {
    badge: "bg-green-50 text-green-950 border-green-300 shadow-xs shadow-green-500/10",
    text: "text-green-700",
    glow: "bg-green-500",
    stroke: "#22c55e",
    aura: "from-green-500/10 via-emerald-500/5 to-transparent",
  },
  Moderate: {
    badge: "bg-amber-50 text-amber-950 border-amber-300 shadow-xs shadow-amber-500/10",
    text: "text-amber-700",
    glow: "bg-amber-500",
    stroke: "#f59e0b",
    aura: "from-amber-500/10 via-yellow-500/5 to-transparent",
  },
  Poor: {
    badge: "bg-orange-50 text-orange-950 border-orange-300 shadow-xs shadow-orange-500/10",
    text: "text-orange-700",
    glow: "bg-orange-500",
    stroke: "#f97316",
    aura: "from-orange-500/10 via-amber-500/5 to-transparent",
  },
  "Very Poor": {
    badge: "bg-rose-50 text-rose-950 border-rose-300 shadow-xs shadow-rose-500/10",
    text: "text-rose-700",
    glow: "bg-rose-500",
    stroke: "#f43f5e",
    aura: "from-rose-500/10 via-red-500/5 to-transparent",
  },
  Severe: {
    badge: "bg-purple-50 text-purple-950 border-purple-300 shadow-xs shadow-purple-500/10",
    text: "text-purple-700",
    glow: "bg-purple-600",
    stroke: "#a855f7",
    aura: "from-purple-500/10 via-rose-500/5 to-transparent",
  },
};

/**
 * Calculates human-readable relative update time from ISO date string.
 */
function formatRelativeTime(
  isoDateStr: string,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): string {
  try {
    const updatedMs = Date.parse(isoDateStr);
    if (!Number.isFinite(updatedMs)) return t("updatedJustNow");
    const diffMs = Date.now() - updatedMs;
    const diffMin = Math.max(0, Math.floor(diffMs / 60_000));
    if (diffMin < 1) return t("updatedJustNow");
    if (diffMin < 60) return t("updatedMinAgo", { min: diffMin });
    const diffHours = Math.floor(diffMin / 60);
    return t("updatedHoursAgo", { hours: diffHours });
  } catch {
    return t("updatedJustNow");
  }
}

/**
 * Live AQI Card displaying:
 * - City name and big AQI number with visual radial arc
 * - CPCB Category as explicit TEXT label (never color alone)
 * - PM2.5 concentration (µg/m³)
 * - Relative updated time with animated live pulse
 * - "Cached" badge when source is cached fallback
 * - Accessible loading skeleton and retry button on error
 */
export function AqiCard({ city, onDataLoaded }: AqiCardProps): JSX.Element {
  const { t } = useT();
  const [data, setData] = useState<AqiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/aqi?city=${encodeURIComponent(city)}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch AQI (status ${res.status})`);
        }
        const json: AqiResponse = await res.json();
        if (!isCancelled) {
          setData(json);
          setError(null);
          setLoading(false);
          onDataLoaded?.(json);
        }
      } catch {
        if (!isCancelled) {
          setError(t("aqiError"));
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [city, retryKey, onDataLoaded, t]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryKey((k) => k + 1);
  };

  // Loading Skeleton
  if (loading) {
    return (
      <section
        role="status"
        aria-label={t("loadingAqi")}
        className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-6 sm:p-7 shadow-xs motion-reduce:animate-none animate-pulse h-full flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <div className="h-5 w-28 rounded-md bg-slate-200" />
          <div className="h-5 w-20 rounded-full bg-slate-200" />
        </div>
        <div className="mt-5 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-14 w-28 rounded-xl bg-slate-200" />
            <div className="h-4 w-36 rounded-md bg-slate-200" />
          </div>
          <div className="h-20 w-20 rounded-full bg-slate-100" />
        </div>
        <div className="mt-4 h-8 w-44 rounded-xl bg-slate-200" />
        <span className="sr-only">{t("loadingAqi")}</span>
      </section>
    );
  }

  // Error State with Retry Button
  if (error || !data) {
    return (
      <section
        role="alert"
        aria-labelledby="aqi-error-heading"
        className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 sm:p-7 shadow-xs backdrop-blur-md"
      >
        <div className="flex items-start gap-3">
          <AlertTriangleIcon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h2 id="aqi-error-heading" className="text-base font-semibold text-rose-950">
              {error ?? t("aqiError")}
            </h2>
            <p className="mt-1 text-xs text-rose-800">
              Live AQI load nahi ho paya. Ek baar phir koshish karein.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
        >
          <RefreshIcon className="h-4 w-4" />
          <span>{t("aqiRetry")}</span>
        </button>
      </section>
    );
  }

  const categoryLabel = data.category.label;
  const categoryStyle = CATEGORY_STYLES[categoryLabel] ?? CATEGORY_STYLES.Severe;
  const relativeTime = formatRelativeTime(data.updatedAt, t);

  // SVG Gauge calculations (semi-circular / 270 degree arc)
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const normalizedAqi = Math.max(0, Math.min(500, data.aqi));
  const strokeDashoffset = circumference - (normalizedAqi / 500) * circumference;

  return (
    <section
      aria-labelledby="aqi-card-heading"
      className={`relative overflow-hidden rounded-3xl border border-teal-900/10 bg-white/95 backdrop-blur-md p-4.5 sm:p-6 lg:p-7 shadow-xl shadow-teal-950/5 transition-all duration-300 hover:shadow-2xl bg-linear-to-br ${categoryStyle.aura} h-full flex flex-col justify-between`}
    >
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-teal-100/60 text-xs text-teal-800"
            aria-hidden="true"
          >
            <MapPinIcon className="h-3.5 w-3.5 text-teal-700" />
          </span>
          <h2
            id="aqi-card-heading"
            className="text-base font-bold text-slate-950 sm:text-lg truncate"
          >
            {data.city}
          </h2>
          <span className="text-xs font-medium text-slate-500 shrink-0">• {relativeTime}</span>
        </div>

        {/* Source Badge with Live Pulse Indicator */}
        {data.source === "cached" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-semibold text-amber-950 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            {t("badgeCached")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-semibold text-emerald-950 shadow-2xs">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {t("badgeLive")}
          </span>
        )}
      </div>

      {/* Main Stats with Radial Gauge */}
      <div className="mt-4 sm:mt-5 flex items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 font-mono">
              {data.aqi}
            </span>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
              AQI
            </span>
          </div>

          <div className="mt-1.5 sm:mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-medium text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
            <span>
              PM2.5:{" "}
              <strong className="font-semibold text-slate-900">{Math.round(data.pm25Now)}</strong>{" "}
              {t("pm25Unit")}
            </span>
          </div>
        </div>

        {/* Visual Circular Gauge */}
        <div className="relative flex shrink-0 items-center justify-center" aria-hidden="true">
          <svg className="h-18 w-18 sm:h-22 sm:w-22 -rotate-90 transform" viewBox="0 0 80 80">
            {/* Background ring */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="text-slate-100"
              strokeWidth="7"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke={categoryStyle.stroke}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 motion-reduce:transition-none"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
              CPCB
            </span>
            <span className="text-sm font-black text-slate-800">
              {Math.round((normalizedAqi / 500) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* CPCB Category as explicit TEXT label (never color only) */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div
          role="status"
          aria-label={`CPCB Category: ${categoryLabel}`}
          className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs sm:text-sm font-bold ${categoryStyle.badge}`}
        >
          <span className={`h-2 w-2 rounded-full ${categoryStyle.glow}`} aria-hidden="true" />
          <span>
            {categoryLabel} ({data.category.hinglish})
          </span>
        </div>

        <span className="text-xs font-medium text-slate-500">CPCB 24-hr National Standard</span>
      </div>
    </section>
  );
}
