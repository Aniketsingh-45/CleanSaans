"use client";

import { useId, useState, type JSX } from "react";
import type { HourlyPm25 } from "@/lib/data/aqi";
import type { CpcbCategoryLabel } from "@/lib/data/cpcb";
import {
  bestWindow,
  categoryFor,
  findStartIndexForClockHour,
  getKolkataClockHour,
  getPm25Value,
} from "@/lib/engine/window";
import { useT } from "@/lib/i18n";
import type { UserProfile } from "@/lib/profile";

export interface SafeWindowProps {
  hourly: readonly HourlyPm25[];
  profile: UserProfile;
  startHour?: number;
  onStartHourChange?: (hour: number) => void;
  durationMinutes?: number;
  onDurationMinutesChange?: (min: number) => void;
}

const BAR_COLOR_CLASSES: Record<CpcbCategoryLabel, string> = {
  Good: "bg-emerald-500",
  Satisfactory: "bg-green-500",
  Moderate: "bg-amber-400",
  Poor: "bg-orange-500",
  "Very Poor": "bg-red-600",
  Severe: "bg-purple-700",
};

/**
 * Interactive "Bahar jaane ka sabse saaf time" component.
 * Features:
 * - 24-hour visual bar timeline with colors AND accessible text labels
 * - Visually-hidden data table for screen readers
 * - Two labelled controls (start time, duration 30-180 min) with min-h-11 touch targets
 * - Live engine calculation of approximate cigarette equivalents and savings
 * - "Best time set karo" button that auto-adjusts start time to optimal window
 * - Live polite announcements (`aria-live="polite"`)
 * - Sensitive member warning chip when band is Poor or worse
 * - Respects prefers-reduced-motion
 */
export function SafeWindow({
  hourly,
  profile,
  startHour: propStartHour,
  onStartHourChange,
  durationMinutes: propDurationMinutes,
  onDurationMinutesChange,
}: SafeWindowProps): JSX.Element {
  const { t } = useT();
  const startSliderId = useId();
  const durationSliderId = useId();

  // Next 24 hours of PM2.5 forecast
  const hourly24 = hourly.slice(0, 24);

  // Initialize start hour with current Kolkata clock hour or default to 7 AM
  const currentClockHour =
    hourly24[0]?.time !== undefined ? getKolkataClockHour(hourly24[0].time) : 7;

  const [internalStartHour, setInternalStartHour] = useState<number>(currentClockHour);
  const [internalDurationMinutes, setInternalDurationMinutes] = useState<number>(60);

  const startHour = propStartHour !== undefined ? propStartHour : internalStartHour;
  const setStartHour = (h: number) => {
    setInternalStartHour(h);
    onStartHourChange?.(h);
  };

  const durationMinutes =
    propDurationMinutes !== undefined ? propDurationMinutes : internalDurationMinutes;
  const setDurationMinutes = (m: number) => {
    setInternalDurationMinutes(m);
    onDurationMinutesChange?.(m);
  };

  const durationHours = Math.max(0.5, Math.min(3, durationMinutes / 60));
  const hasSensitive = profile.kids > 0 || profile.elderly > 0 || profile.asthma;

  // Compute live outing exposure and cleanest window using /lib/engine/window.ts
  const windowResult = bestWindow(
    hourly,
    durationHours,
    6, // earliest standard outdoor hour (6 AM)
    21, // latest standard outdoor hour (9 PM)
    "walk",
    startHour,
    { hasSensitive }
  );

  const bestHour = windowResult.startHour;
  const bestHourEnd = Math.floor((bestHour + durationHours) % 24);
  const chosenEnd = Math.floor((startHour + durationHours) % 24);

  const maxPm25 = Math.max(100, ...hourly24.map((h) => h.pm25));

  // Evaluate category and sensitive member risk during the user's chosen window
  const chosenStartIndex = findStartIndexForClockHour(hourly, startHour);
  let chosenPm25Sum = 0;
  let chosenWeight = 0;
  if (chosenStartIndex !== -1) {
    let rem = durationHours;
    let idx = chosenStartIndex;
    while (rem > 0 && idx < hourly.length) {
      const w = Math.min(1, rem);
      chosenPm25Sum += getPm25Value(hourly[idx]) * w;
      chosenWeight += w;
      rem -= w;
      idx += 1;
    }
  }
  const chosenAvgPm25 = chosenWeight > 0 ? chosenPm25Sum / chosenWeight : 0;
  const chosenCategory = categoryFor(chosenAvgPm25);

  const isChosenPoorOrWorse =
    chosenCategory.label === "Poor" ||
    chosenCategory.label === "Very Poor" ||
    chosenCategory.label === "Severe";

  const shouldWarn = hasSensitive && isChosenPoorOrWorse;

  const durationHoursFormatted = (durationMinutes / 60).toFixed(durationMinutes % 60 === 0 ? 0 : 1);

  return (
    <section
      aria-labelledby="safe-window-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
    >
      <div className="border-b border-slate-100 pb-4">
        <h2 id="safe-window-heading" className="text-lg font-bold text-slate-950 sm:text-xl">
          {t("safeWindowTitle")}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{t("safeWindowSubtitle")}</p>
      </div>

      {/* 24-Hour Bar Timeline */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>

        <div
          role="img"
          aria-label="24-hour PM2.5 pollution chart"
          className="mt-2 flex h-24 items-end gap-1 rounded-xl border border-slate-100 bg-slate-50/80 p-2"
        >
          {hourly24.map((entry, index) => {
            const hour = entry.time !== undefined ? getKolkataClockHour(entry.time) : index;
            const category = categoryFor(entry.pm25);
            const colorClass = BAR_COLOR_CLASSES[category.label] ?? "bg-slate-400";

            // Determine if this hour falls inside chosen or best window
            const isChosen =
              startHour <= chosenEnd
                ? hour >= startHour && hour <= chosenEnd
                : hour >= startHour || hour <= chosenEnd;

            const isBest =
              bestHour <= bestHourEnd
                ? hour >= bestHour && hour <= bestHourEnd
                : hour >= bestHour || hour <= bestHourEnd;

            const heightPct = Math.max(15, Math.min(100, (entry.pm25 / maxPm25) * 100));

            return (
              <div
                key={index}
                title={`${String(hour).padStart(2, "0")}:00 - ${Math.round(entry.pm25)} µg/m³ (${category.label})`}
                className="group relative flex flex-1 flex-col items-center justify-end h-full"
              >
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-sm transition-all motion-reduce:transition-none ${colorClass} ${
                    isChosen ? "ring-2 ring-teal-900 ring-offset-1" : "opacity-85"
                  } ${isBest && !isChosen ? "border-t-2 border-white" : ""}`}
                />
                {/* Visual indicator dot for Best Time */}
                {isBest && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-3.5 h-1.5 w-1.5 rounded-full bg-teal-800"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" aria-hidden="true" />
              Acchi
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="h-2.5 w-2.5 rounded-xs bg-amber-400" aria-hidden="true" />
              Moderate
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="h-2.5 w-2.5 rounded-xs bg-orange-500" aria-hidden="true" />
              Poor
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="h-2.5 w-2.5 rounded-xs bg-red-600" aria-hidden="true" />
              Very Poor
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="h-2.5 w-2.5 rounded-xs bg-purple-700" aria-hidden="true" />
              Severe
            </span>
          </div>

          <div className="flex items-center gap-2 font-medium">
            <span className="inline-flex items-center gap-1 text-teal-900">
              <span className="h-2 w-2 rounded-full bg-teal-800" aria-hidden="true" />
              {t("bestWindowBadge")}
            </span>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-600">{t("chartColorNote")}</p>

        {/* Visually-hidden data table for screen readers */}
        <table className="sr-only">
          <caption>{t("tableSrTitle")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("tableColTime")}</th>
              <th scope="col">{t("tableColPm25")}</th>
              <th scope="col">{t("tableColCategory")}</th>
            </tr>
          </thead>
          <tbody>
            {hourly24.map((entry, idx) => {
              const h = entry.time !== undefined ? getKolkataClockHour(entry.time) : idx;
              const cat = categoryFor(entry.pm25);
              return (
                <tr key={idx}>
                  <td>{String(h).padStart(2, "0")}:00</td>
                  <td>{Math.round(entry.pm25)}</td>
                  <td>
                    {cat.label} ({cat.hinglish})
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Interactive Controls */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Start Time Slider */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor={startSliderId} className="text-sm font-semibold text-slate-900">
              {t("startTimeLabel")}
            </label>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">
              {String(startHour).padStart(2, "0")}:00
            </span>
          </div>
          <input
            id={startSliderId}
            type="range"
            min="0"
            max="23"
            step="1"
            value={startHour}
            onChange={(e) => setStartHour(parseInt(e.target.value, 10))}
            className="mt-2 block min-h-11 w-full cursor-pointer accent-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          />
        </div>

        {/* Duration Slider */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor={durationSliderId} className="text-sm font-semibold text-slate-900">
              {t("durationLabel")}
            </label>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">
              {t("durationMinutes", { min: durationMinutes, hours: durationHoursFormatted })}
            </span>
          </div>
          <input
            id={durationSliderId}
            type="range"
            min="30"
            max="180"
            step="15"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
            className="mt-2 block min-h-11 w-full cursor-pointer accent-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          />
        </div>
      </div>

      {/* Button to auto-set optimal time */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStartHour(bestHour)}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-teal-700/30 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900 shadow-xs transition-colors hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          ⚡ {t("setBestTimeBtn")} ({String(bestHour).padStart(2, "0")}:00)
        </button>
      </div>

      {/* Live Results Display */}
      <div aria-live="polite" className="mt-5 rounded-xl border border-teal-200 bg-teal-50/70 p-4">
        <p className="text-sm font-bold text-slate-950 sm:text-base">
          {t("exposureAtThisTime", {
            low: windowResult.baselineCost.low,
            high: windowResult.baselineCost.high,
          })}
        </p>
        <p className="mt-1 text-sm font-medium text-teal-900">
          {t("bestTimeResult", {
            time: String(bestHour).padStart(2, "0"),
            saved: windowResult.saved.high || windowResult.saved.low,
          })}
        </p>
      </div>

      {/* Sensitive Member Warning Chip */}
      {shouldWarn && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-950"
        >
          <span aria-hidden="true" className="text-base">
            ⚠️
          </span>
          <p>{t("sensitiveAvoidWarning")}</p>
        </div>
      )}
    </section>
  );
}
