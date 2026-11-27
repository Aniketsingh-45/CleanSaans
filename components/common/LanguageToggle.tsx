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
      className={`inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-xs ${className}`}
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
            className={`min-h-11 min-w-14 cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
              isSelected
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
