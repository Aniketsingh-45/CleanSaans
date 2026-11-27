"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type ChangeEvent, type FormEvent, type JSX } from "react";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CameraIcon,
  RefreshIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@/components/common/Icons";
import { LanguageToggle, useT } from "@/lib/i18n";
import type { AuditLeak, AuditResponse } from "@/lib/data/audit";

/**
 * Client-side canvas compression helper.
 * Compresses oversized photos to ~1.5MB before uploading over mobile networks.
 * Gracefully falls back to original file if canvas/image conversion fails.
 */
async function compressImageForUpload(
  file: File,
  targetBytes: number = 1.5 * 1024 * 1024
): Promise<File> {
  // If file is already smaller than target, return as-is
  if (file.size <= targetBytes) return file;

  return new Promise((resolve) => {
    // If not in a DOM environment (e.g. tests without full canvas mock)
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve(file);
      return;
    }

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Downscale large dimension to max 1920px while preserving aspect ratio
        const maxDim = 1920;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.82;
        const attemptCompression = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              if (blob.size <= targetBytes || quality <= 0.4) {
                const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                quality -= 0.15;
                attemptCompression();
              }
            },
            "image/jpeg",
            quality
          );
        };

        attemptCompression();
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    } catch {
      resolve(file);
    }
  });
}

export default function AuditPage(): JSX.Element {
  const { t } = useT();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResponse | null>(null);

  // Handles photo selection from file picker or camera capture
  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;

    setError(null);
    setAuditResult(null);

    // Apply canvas compression if needed
    const processedFile = await compressImageForUpload(file);
    setSelectedFile(processedFile);

    // Generate local object URL preview
    const objectUrl = URL.createObjectURL(processedFile);
    setPreviewUrl(objectUrl);
  }, []);

  // Clears current photo and resets picker
  const handleClearPhoto = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setAuditResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl]);

  // Submits form data to /api/audit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setAuditResult(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const res = await fetch("/api/audit", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errJson?.error || t("auditErrorGeneric"));
      }

      const json: AuditResponse = await res.json();
      setAuditResult(json);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("auditErrorGeneric");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getEffortBadge = (effort: AuditLeak["effort"]) => {
    switch (effort) {
      case "low":
        return {
          label: t("auditEffortLow"),
          style: "bg-emerald-100 text-emerald-950 border-emerald-300",
        };
      case "med":
        return {
          label: t("auditEffortMed"),
          style: "bg-amber-100 text-amber-950 border-amber-300",
        };
      case "high":
        return {
          label: t("auditEffortHigh"),
          style: "bg-rose-100 text-rose-950 border-rose-300",
        };
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6 sm:px-6">
      {/* Skip to Content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-teal-900 focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
      >
        {t("skipToContent")}
      </a>

      {/* Header */}
      <header className="sticky top-0 z-30 -mx-4 -mt-6 mb-2 flex flex-wrap items-center justify-between gap-4 border-b border-teal-900/10 bg-white/80 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 shadow-xs">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 transition-colors hover:text-teal-950"
          >
            <ArrowRightIcon className="rotate-180 h-3.5 w-3.5 text-teal-700" />
            <span>{t("appName")} Home</span>
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {t("auditPageTitle")}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-teal-300/80 bg-teal-100/80 px-2 py-0.5 text-[10px] font-extrabold text-teal-950">
              Vision AI
            </span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-teal-800 sm:text-sm">
            {t("auditPageSubtitle")}
          </p>
        </div>

        <LanguageToggle />
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 space-y-6 py-6">
        {/* Privacy Note */}
        <section
          aria-label="Privacy notice"
          className="flex items-center gap-3.5 rounded-2xl border border-teal-200/80 bg-linear-to-r from-teal-50/90 to-emerald-50/80 p-4 text-xs font-semibold text-teal-950 shadow-xs"
        >
          <ShieldCheckIcon className="h-5 w-5 text-teal-800 shrink-0" />
          <p className="leading-relaxed">{t("auditPrivacyNote")}</p>
        </section>

        {/* Upload Form */}
        <form
          onSubmit={handleSubmit}
          className="relative overflow-hidden rounded-3xl border border-teal-900/10 bg-white/95 p-6 shadow-xl shadow-teal-950/5 backdrop-blur-md sm:p-7"
        >
          {/* Ambient glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-linear-to-br from-teal-200/25 to-emerald-200/15 blur-3xl"
          />

          <div className="relative space-y-4">
            {/* Labelled File Input */}
            <div className="rounded-2xl border-2 border-dashed border-teal-300/80 bg-linear-to-b from-teal-50/40 via-white to-slate-50/40 p-5 text-center transition-all hover:border-teal-500">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100/90 text-teal-800 shadow-inner">
                <CameraIcon className="h-6 w-6" />
              </div>
              <label
                htmlFor="audit-photo-input"
                className="mt-3 block text-sm font-extrabold text-slate-950 sm:text-base"
              >
                {t("auditUploadLabel")}
              </label>
              <p className="mt-1 text-xs font-medium text-slate-600">{t("auditUploadHint")}</p>

              <input
                ref={fileInputRef}
                id="audit-photo-input"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handleFileChange}
                className="mt-4 block w-full text-xs text-slate-600 file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-xl file:border-0 file:bg-teal-900 file:px-5 file:py-2.5 file:text-xs file:font-bold file:text-white file:shadow-md hover:file:bg-teal-950 focus:outline-none"
              />
            </div>

            {/* Photo Preview with Alt Text */}
            {previewUrl && (
              <div className="space-y-4 pt-2">
                <div className="relative overflow-hidden rounded-2xl border-2 border-teal-500/40 bg-slate-950 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={t("auditPreviewAlt")}
                    className="max-h-80 w-full object-contain opacity-95"
                  />
                  {/* Viewfinder crosshairs in corners */}
                  <div className="pointer-events-none absolute top-3 left-3 h-5 w-5 border-t-2 border-l-2 border-teal-400" />
                  <div className="pointer-events-none absolute top-3 right-3 h-5 w-5 border-t-2 border-r-2 border-teal-400" />
                  <div className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-teal-400" />
                  <div className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-teal-400" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-slate-300/90 bg-white px-5 py-2 text-xs font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  >
                    <RefreshIcon className="h-4 w-4 text-slate-600" />
                    <span>{t("auditRetakeBtn")}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !selectedFile}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-teal-800 via-teal-900 to-slate-950 px-7 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-teal-950/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:from-teal-900 hover:to-black disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    <span>{loading ? t("auditAnalyzingText") : t("auditAnalyzeBtn")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Aria-Live Loading Notification */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {loading && t("auditAnalyzingText")}
        </div>

        {/* Loading Spinner / Skeleton */}
        {loading && (
          <section
            role="status"
            aria-label={t("auditAnalyzingText")}
            className="space-y-4 rounded-3xl border border-teal-200 bg-white p-6 shadow-xl animate-pulse motion-reduce:animate-none"
          >
            <div className="flex items-center gap-3">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-teal-800 border-t-transparent" />
              <div className="h-6 w-48 rounded-md bg-teal-100" />
            </div>
            <div className="h-4 w-64 rounded-md bg-slate-100" />
            <div className="mt-4 h-24 w-full rounded-2xl bg-slate-100" />
            <div className="h-24 w-full rounded-2xl bg-slate-100" />
            <span className="sr-only">{t("auditAnalyzingText")}</span>
          </section>
        )}

        {/* Error State */}
        {error && !loading && (
          <section
            role="alert"
            className="rounded-3xl border border-rose-200 bg-rose-50/90 p-5 text-sm text-rose-950 shadow-md"
          >
            <p className="font-bold">{error}</p>
          </section>
        )}

        {/* Audit Results */}
        {auditResult && !loading && (
          <section aria-labelledby="audit-results-heading" className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-teal-900/10 bg-white/95 p-6 shadow-xl shadow-teal-950/5 backdrop-blur-md sm:p-7">
              <div className="border-b border-slate-100/80 pb-5">
                <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50/90 px-3 py-0.5 text-xs font-bold text-teal-900 shadow-2xs">
                  <SparklesIcon className="h-3.5 w-3.5 text-teal-800" />
                  <span>Diagnostic Findings</span>
                </div>
                <h2
                  id="audit-results-heading"
                  className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl"
                >
                  {t("auditResultsTitle")}
                </h2>
                <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                  {t("auditResultsSubtitle")}
                </p>
              </div>

              {/* Burning Detected Alert Tip */}
              {auditResult.burning_detected && (
                <div
                  role="alert"
                  className="mt-5 rounded-2xl border-2 border-rose-400 bg-rose-50/95 p-4.5 text-xs text-rose-950 shadow-sm"
                >
                  <p className="flex items-center gap-2 text-sm font-extrabold">
                    <AlertTriangleIcon className="h-5 w-5 text-rose-700 shrink-0" />
                    <span>{t("auditBurningAlertTitle")}</span>
                  </p>
                  <p className="mt-1.5 leading-relaxed text-rose-950">
                    {t("auditBurningAlertText")}
                  </p>
                </div>
              )}

              {/* Leaks List (up to 3 cards) */}
              {auditResult.leaks.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {auditResult.leaks.map((leak, idx) => {
                    const badge = getEffortBadge(leak.effort);
                    return (
                      <article
                        key={`leak-${idx}`}
                        className="rounded-2xl border border-slate-200/80 bg-linear-to-b from-white to-slate-50/60 p-5 shadow-xs transition-all hover:border-teal-300 sm:p-6"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <h3 className="text-base font-extrabold text-slate-950 sm:text-lg">
                            {leak.issue}
                          </h3>

                          <div className="flex items-center gap-2">
                            {/* Effort Badge */}
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-extrabold shadow-2xs ${badge.style}`}
                            >
                              {badge.label}
                            </span>

                            {/* Cost Badge */}
                            <span className="inline-flex items-center rounded-full border border-slate-300/80 bg-slate-100 px-3 py-0.5 text-xs font-extrabold text-slate-800">
                              {leak.approx_cost_inr === 0
                                ? t("freeBadge")
                                : `₹${leak.approx_cost_inr}`}
                            </span>
                          </div>
                        </div>

                        {/* Why it matters */}
                        <div className="mt-3.5 text-xs font-medium leading-relaxed text-slate-700 sm:text-sm">
                          <strong className="font-extrabold text-slate-900">
                            {t("auditWhyTitle")}:{" "}
                          </strong>
                          {leak.why_it_matters}
                        </div>

                        {/* Recommended Fix */}
                        <div className="mt-3.5 rounded-xl border border-teal-200/80 bg-linear-to-br from-teal-50/90 to-emerald-50/60 p-4 text-xs font-medium leading-relaxed text-teal-950 shadow-2xs sm:text-sm">
                          <strong className="font-extrabold text-teal-950">
                            {t("auditFixTitle")}:{" "}
                          </strong>
                          {leak.fix}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                /* Friendly Empty State */
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-7 text-center text-sm font-semibold text-slate-600">
                  <p>{t("auditEmptyMessage")}</p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer
        role="contentinfo"
        className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-600"
      >
        <p>{t("footerDisclaimer")}</p>
      </footer>
    </div>
  );
}
