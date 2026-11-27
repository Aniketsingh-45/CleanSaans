"use client";

import type { JSX } from "react";
import { useT, type Language } from "@/lib/i18n/provider";

interface LanguageOption {
  id: Language;
  label: string;
}

const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { id: "hinglish", label: "Hinglish" },
  { id: "hi", label: "हिंदी" },
  { id: "en", label: "English" },
];

export interface LanguageToggleProps {
  className?: string;
}

/**
 * Accessible language switcher adhering to WCAG 2.1 touch target (min-h-11)
 * and keyboard navigation guidelines.
 */
export function LanguageToggle({ className = "" }: LanguageToggleProps): JSX.Element {
  const { lang, setLanguage, t } = useT();

  return (
    <div
      role="radiogroup"
      aria-label={t("languageToggleAria")}
      className={`inline-flex items-center rounded-xl sm:rounded-2xl border border-teal-900/10 bg-white/90 p-0.5 sm:p-1 shadow-2xs backdrop-blur-md ${className}`}
    >
      {LANGUAGE_OPTIONS.map((option) => {
        const isSelected = lang === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setLanguage(option.id)}
            className={`min-h-11 min-w-10 sm:min-w-14 cursor-pointer rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
              isSelected
                ? "bg-linear-to-r from-teal-800 to-teal-950 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
