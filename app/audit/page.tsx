"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type ChangeEvent, type FormEvent, type JSX } from "react";
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
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-100 pb-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-teal-800 transition-colors hover:text-teal-950"
          >
            ← {t("appName")} Home
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {t("auditPageTitle")}
          </h1>
          <p className="mt-0.5 text-sm font-medium text-teal-800">{t("auditPageSubtitle")}</p>
        </div>

        <LanguageToggle />
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 space-y-6 py-6">
        {/* Privacy Note */}
        <section
          aria-label="Privacy notice"
          className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs font-medium text-teal-950"
        >
          <p>🔒 {t("auditPrivacyNote")}</p>
        </section>

        {/* Upload Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
        >
          <div className="space-y-4">
            {/* Labelled File Input */}
            <div>
              <label htmlFor="audit-photo-input" className="block text-sm font-bold text-slate-900">
                {t("auditUploadLabel")}
              </label>
              <p className="mt-1 text-xs text-slate-500">{t("auditUploadHint")}</p>

              <input
                ref={fileInputRef}
                id="audit-photo-input"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handleFileChange}
                className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-xl file:border-0 file:bg-teal-50 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-teal-900 hover:file:bg-teal-100 focus:outline-none"
              />
            </div>

            {/* Photo Preview with Alt Text */}
            {previewUrl && (
              <div className="space-y-3 pt-2">
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={t("auditPreviewAlt")}
                    className="max-h-72 w-full object-contain"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  >
                    🔄 {t("auditRetakeBtn")}
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !selectedFile}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-teal-900 px-6 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-teal-950 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                  >
                    {loading ? t("auditAnalyzingText") : t("auditAnalyzeBtn")}
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
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse motion-reduce:animate-none"
          >
            <div className="h-6 w-48 rounded-md bg-slate-200" />
            <div className="h-4 w-64 rounded-md bg-slate-100" />
            <div className="mt-4 h-24 w-full rounded-xl bg-slate-100" />
            <div className="h-24 w-full rounded-xl bg-slate-100" />
            <span className="sr-only">{t("auditAnalyzingText")}</span>
          </section>
        )}

        {/* Error State */}
        {error && !loading && (
          <section
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 text-sm text-rose-950 shadow-xs"
          >
            <p className="font-semibold">{error}</p>
          </section>
        )}

        {/* Audit Results */}
        {auditResult && !loading && (
          <section aria-labelledby="audit-results-heading" className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2
                  id="audit-results-heading"
                  className="text-lg font-bold text-slate-950 sm:text-xl"
                >
                  {t("auditResultsTitle")}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{t("auditResultsSubtitle")}</p>
              </div>

              {/* Burning Detected Alert Tip */}
              {auditResult.burning_detected && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-950 shadow-2xs"
                >
                  <p className="font-bold sm:text-sm">⚠️ {t("auditBurningAlertTitle")}</p>
                  <p className="mt-1 leading-relaxed text-rose-900">{t("auditBurningAlertText")}</p>
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
                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-all sm:p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-slate-950 sm:text-lg">
                            {leak.issue}
                          </h3>

                          <div className="flex items-center gap-2">
                            {/* Effort Badge */}
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.style}`}
                            >
                              {badge.label}
                            </span>

                            {/* Cost Badge */}
                            <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                              {leak.approx_cost_inr === 0
                                ? t("freeBadge")
                                : `₹${leak.approx_cost_inr}`}
                            </span>
                          </div>
                        </div>

                        {/* Why it matters */}
                        <div className="mt-3 text-xs leading-relaxed text-slate-700 sm:text-sm">
                          <strong className="text-slate-900">{t("auditWhyTitle")}: </strong>
                          {leak.why_it_matters}
                        </div>

                        {/* Recommended Fix */}
                        <div className="mt-3 rounded-lg border border-teal-200/60 bg-teal-50/50 p-3 text-xs leading-relaxed text-teal-950 sm:text-sm">
                          <strong className="text-teal-900">{t("auditFixTitle")}: </strong>
                          {leak.fix}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                /* Friendly Empty State */
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
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
