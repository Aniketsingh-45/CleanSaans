"use client";

import { useState, type FormEvent } from "react";
import { ChatIcon, ShieldCheckIcon, SparklesIcon } from "@/components/common/Icons";
import { useT } from "@/lib/i18n";

interface AskBoxProps {
  className?: string;
}

function FormattedAnswer({ text }: { text: string }) {
  const cleaned = text.trim().replace(/\|+$/, "").trim();

  // If plain text with no markdown symbols, render directly for exact matching
  if (!cleaned.includes("*") && !cleaned.includes("\n- ") && !cleaned.includes("\n1. ")) {
    return (
      <p className="mt-3.5 text-xs font-medium leading-relaxed text-slate-800 whitespace-pre-line sm:text-sm">
        {cleaned}
      </p>
    );
  }

  const rawLines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Filter out redundant disclaimer sentences if Gemini appended them
  const filteredLines = rawLines.filter((line) => {
    const lower = line.toLowerCase();
    if (lower.startsWith("*note:") || lower.startsWith("note:")) return false;
    return true;
  });

  return (
    <div className="mt-3.5 space-y-2.5">
      {filteredLines.map((line, idx) => {
        const isBullet = line.startsWith("* ") || line.startsWith("- ") || /^\d+\.\s/.test(line);
        const content = isBullet ? line.replace(/^(\*|-|\d+\.)\s*/, "") : line;
        const boldMatch = content.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/);

        if (boldMatch) {
          const topic = boldMatch[1];
          const rest = boldMatch[2];
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-xl border border-teal-100/90 bg-white/95 p-3 shadow-2xs"
            >
              <SparklesIcon className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-slate-800 sm:text-sm">
                <strong className="font-extrabold text-teal-950 mr-1.5">{topic}:</strong>
                <span>{rest}</span>
              </div>
            </div>
          );
        }

        if (isBullet) {
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-xl border border-teal-100/90 bg-white/95 p-3 shadow-2xs"
            >
              <SparklesIcon className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-slate-800 sm:text-sm">
                {content.replace(/\*\*/g, "")}
              </p>
            </div>
          );
        }

        return (
          <p key={idx} className="text-xs font-medium leading-relaxed text-slate-800 sm:text-sm">
            {content.replace(/\*\*/g, "")}
          </p>
        );
      })}
    </div>
  );
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
      className={`relative overflow-hidden rounded-3xl border border-teal-900/10 bg-white/95 p-4.5 sm:p-6 lg:p-7 shadow-xl shadow-teal-950/5 backdrop-blur-md transition-all ${className}`}
    >
      {/* Background ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-linear-to-tr from-cyan-200/25 to-teal-200/15 blur-3xl"
      />

      <div className="relative flex items-start justify-between gap-4 border-b border-slate-100/80 pb-5">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50/90 px-3 py-0.5 text-xs font-bold text-teal-900 shadow-2xs">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-600" />
            AI Air Intelligence
          </div>
          <h2
            id="ask-box-heading"
            className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl"
          >
            <ChatIcon className="mr-2 inline h-5 w-5 text-teal-800 align-text-bottom" />
            {t("askSectionTitle")}
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">{t("askSectionSubtitle")}</p>
        </div>
      </div>

      {/* Suggested quick questions */}
      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-slate-500">Suggested:</span>
        {[
          "Subah exercise kab karein?",
          "Kya bacchon ke liye N95 zaroori hai?",
          "Ghar ka dhuan kaise kam karein?",
        ].map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setQuestion(prompt)}
            className="inline-flex items-center gap-1.5 cursor-pointer rounded-full border border-teal-200/80 bg-teal-50/70 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-teal-950 transition-all hover:bg-teal-100/90 hover:border-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 shadow-2xs"
          >
            <SparklesIcon className="h-3 w-3 text-teal-700" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="relative mt-4 space-y-3.5">
        <div>
          <label
            htmlFor="ask-question-input"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            {t("askInputLabel")}
          </label>
          <div className="relative mt-2">
            <textarea
              id="ask-question-input"
              rows={3}
              maxLength={500}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t("askPlaceholder")}
              disabled={loading}
              aria-describedby="ask-char-count ask-disclaimer-note"
              className="w-full resize-none rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 text-sm font-medium text-slate-950 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-600/15 disabled:bg-slate-50 disabled:text-slate-500 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <span id="ask-char-count" className="text-xs font-semibold text-slate-500">
            {t("askCharLimit", { count: question.length })}
          </span>

          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="inline-flex min-h-11 w-full sm:w-auto cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-800 to-teal-950 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:from-teal-900 hover:to-slate-950 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:translate-y-0"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t("askSubmittingBtn")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <SparklesIcon className="h-4 w-4" />
                <span>{t("askSubmitBtn")}</span>
              </span>
            )}
          </button>
        </div>

        {/* Permanent safety disclaimer note */}
        <p
          id="ask-disclaimer-note"
          className="rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 text-xs font-semibold text-amber-950 shadow-2xs"
        >
          <ShieldCheckIcon className="mr-1.5 inline h-4 w-4 text-amber-800 align-text-bottom" />
          {t("askDisclaimerNote")}
        </p>
      </form>

      {/* Live region for loading state */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="relative mt-4 flex items-center gap-3.5 rounded-2xl border border-teal-200/80 bg-teal-50/70 p-4.5 text-xs font-bold text-teal-950 shadow-xs"
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
          className="relative mt-4 rounded-2xl border border-rose-200 bg-rose-50/90 p-4.5 text-xs text-rose-950 shadow-xs"
        >
          <p className="font-bold">{error}</p>
          <button
            type="button"
            onClick={handleSubmit}
            className="mt-2.5 inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 shadow-2xs"
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
          className="relative mt-5 rounded-2xl border border-teal-300/80 bg-linear-to-br from-teal-50/90 via-emerald-50/50 to-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center justify-between gap-2 border-b border-teal-200/80 pb-3">
            <h3
              id="ask-answer-heading"
              className="text-sm font-extrabold text-teal-950 sm:text-base"
            >
              <SparklesIcon className="mr-1.5 inline h-4 w-4 text-teal-800 align-text-bottom" />
              {t("askAnswerTitle")}
            </h3>
            <span
              className={`rounded-full px-3 py-0.5 text-2xs font-extrabold uppercase tracking-wider shadow-2xs ${
                source === "ai"
                  ? "border border-teal-300 bg-teal-100 text-teal-950"
                  : "border border-amber-300 bg-amber-100 text-amber-950"
              }`}
            >
              {source === "ai" ? t("askBadgeAi") : t("askBadgeFallback")}
            </span>
          </div>

          <FormattedAnswer text={answer} />

          <div className="mt-4.5 flex flex-wrap items-center justify-between gap-2.5 border-t border-teal-200/80 pt-3">
            <span className="text-2xs font-semibold text-slate-600">
              <ShieldCheckIcon className="mr-1 inline h-3.5 w-3.5 text-slate-500 align-text-bottom" />
              {t("askDisclaimerNote")}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-9 cursor-pointer items-center rounded-lg px-2.5 text-xs font-bold text-teal-900 underline hover:text-teal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              {t("askAnotherBtn")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
