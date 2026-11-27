"use client";

import { useEffect, useState, type JSX } from "react";
import type { AqiResponse } from "@/lib/data/aqi";
import type { CityName } from "@/lib/data/cities";
import type { CpcbCategoryLabel } from "@/lib/data/cpcb";
import { useT, type TranslationKey } from "@/lib/i18n";

export interface AqiCardProps {
  city: CityName;
  onDataLoaded?: (data: AqiResponse) => void;
}

const CATEGORY_STYLES: Record<CpcbCategoryLabel, { badge: string; text: string }> = {
  Good: {
    badge: "bg-emerald-100 text-emerald-950 border-emerald-300",
    text: "text-emerald-800",
  },
  Satisfactory: {
    badge: "bg-green-100 text-green-950 border-green-300",
    text: "text-green-800",
  },
  Moderate: {
    badge: "bg-amber-100 text-amber-950 border-amber-300",
    text: "text-amber-800",
  },
  Poor: {
    badge: "bg-orange-100 text-orange-950 border-orange-300",
    text: "text-orange-800",
  },
  "Very Poor": {
    badge: "bg-red-100 text-red-950 border-red-300",
    text: "text-red-800",
  },
  Severe: {
    badge: "bg-purple-100 text-purple-950 border-purple-300",
    text: "text-purple-900",
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
 * - City name and big AQI number
 * - CPCB Category as explicit TEXT label (never color alone)
 * - PM2.5 concentration (µg/m³)
 * - Relative updated time
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
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs motion-reduce:animate-none animate-pulse"
      >
        <div className="flex items-center justify-between">
          <div className="h-5 w-28 rounded-md bg-slate-200" />
          <div className="h-5 w-20 rounded-full bg-slate-200" />
        </div>
        <div className="mt-4 flex items-baseline gap-3">
          <div className="h-12 w-24 rounded-lg bg-slate-200" />
          <div className="h-6 w-36 rounded-md bg-slate-200" />
        </div>
        <div className="mt-4 h-4 w-40 rounded-md bg-slate-200" />
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
        className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6 shadow-xs"
      >
        <h2 id="aqi-error-heading" className="text-base font-semibold text-rose-950">
          {error ?? t("aqiError")}
        </h2>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
        >
          {t("aqiRetry")}
        </button>
      </section>
    );
  }

  const categoryLabel = data.category.label;
  const categoryStyle = CATEGORY_STYLES[categoryLabel] ?? CATEGORY_STYLES.Severe;
  const relativeTime = formatRelativeTime(data.updatedAt, t);

  return (
    <section
      aria-labelledby="aqi-card-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <h2 id="aqi-card-heading" className="text-lg font-bold text-slate-950">
            {data.city}
          </h2>
          <span className="text-xs text-slate-600">• {relativeTime}</span>
        </div>

        {/* Source badge: cached or live */}
        {data.source === "cached" ? (
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
            {t("badgeCached")}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-950">
            {t("badgeLive")}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              {data.aqi}
            </span>
            <span className="text-sm font-semibold text-slate-600">AQI</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {Math.round(data.pm25Now)} {t("pm25Unit")}
          </p>
        </div>

        {/* CPCB Category as explicit TEXT label (never color only) */}
        <div
          role="status"
          aria-label={`CPCB Category: ${categoryLabel}`}
          className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-sm font-bold ${categoryStyle.badge}`}
        >
          <span>
            {categoryLabel} ({data.category.hinglish})
          </span>
        </div>
      </div>
    </section>
  );
}
