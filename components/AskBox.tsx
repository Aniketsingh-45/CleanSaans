"use client";

import { useState, type FormEvent } from "react";
import { useT } from "@/lib/i18n";

interface AskBoxProps {
  className?: string;
}

export function AskBox({ className = "" }: AskBoxProps) {
  const { t, lang } = useT();

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [source, setSource] = useState<"ai" | "fallback" | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setSource(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, language: lang }),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errJson?.error || t("askErrorGeneric"));
      }

      const json = (await res.json()) as { answer: string; source: "ai" | "fallback" };
      setAnswer(json.answer);
      setSource(json.source);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("askErrorGeneric");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuestion("");
    setAnswer(null);
    setError(null);
    setSource(null);
  };

  return (
    <section
      aria-labelledby="ask-box-heading"
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm sm:p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="ask-box-heading" className="text-base font-bold text-slate-900 sm:text-lg">
            💬 {t("askSectionTitle")}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
            {t("askSectionSubtitle")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="ask-question-input"
            className="block text-xs font-semibold text-slate-700"
          >
            {t("askInputLabel")}
          </label>
          <div className="relative mt-1.5">
            <textarea
              id="ask-question-input"
              rows={3}
              maxLength={500}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t("askPlaceholder")}
              disabled={loading}
              aria-describedby="ask-char-count ask-disclaimer-note"
              className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span id="ask-char-count" className="text-xs text-slate-600">
            {t("askCharLimit", { count: question.length })}
          </span>

          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-teal-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-teal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t("askSubmittingBtn")}
              </span>
            ) : (
              t("askSubmitBtn")
            )}
          </button>
        </div>

        {/* Permanent safety disclaimer note */}
        <p
          id="ask-disclaimer-note"
          className="rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-xs font-medium text-amber-950"
        >
          ℹ️ {t("askDisclaimerNote")}
        </p>
      </form>

      {/* Live region for loading state */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/50 p-4 text-xs font-medium text-teal-950"
        >
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-800 border-t-transparent" />
          <p>{t("askLoadingText")}</p>
        </div>
      )}

      {/* Live region for error state */}
      {error && !loading && (
        <div
          role="alert"
          aria-live="polite"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-950"
        >
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={handleSubmit}
            className="mt-2.5 inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
          >
            {t("aqiRetry")}
          </button>
        </div>
      )}

      {/* Live region for answer */}
      {answer && !loading && (
        <div
          role="region"
          aria-live="polite"
          aria-labelledby="ask-answer-heading"
          className="mt-4 rounded-xl border border-teal-200 bg-teal-50/60 p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-2 border-b border-teal-200/60 pb-2.5">
            <h3 id="ask-answer-heading" className="text-sm font-bold text-teal-950">
              💡 {t("askAnswerTitle")}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-2xs font-bold uppercase tracking-wider ${
                source === "ai"
                  ? "border border-teal-300 bg-teal-100 text-teal-950"
                  : "border border-amber-300 bg-amber-100 text-amber-950"
              }`}
            >
              {source === "ai" ? t("askBadgeAi") : t("askBadgeFallback")}
            </span>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-800 whitespace-pre-line sm:text-sm">
            {answer}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-teal-200/60 pt-3">
            <span className="text-2xs text-slate-600">ℹ️ {t("askDisclaimerNote")}</span>
            <button
              type="button"
              onClick={handleReset}
              className="cursor-pointer text-xs font-semibold text-teal-900 underline hover:text-teal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              {t("askAnotherBtn")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
