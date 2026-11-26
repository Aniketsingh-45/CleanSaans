"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { en } from "./en";
import { hi } from "./hi";
import { hinglish, type Dictionary, type TranslationKey } from "./hinglish";

export type Language = "hinglish" | "hi" | "en";

export const DEFAULT_LANGUAGE: Language = "hinglish";
export const STORAGE_KEY = "cleansaans_lang";

/**
 * Maps app language to official IETF BCP 47 language tag for <html lang="...">.
 * Per specification: hinglish -> "en", hi -> "hi", en -> "en".
 */
export const HTML_LANG_MAP: Record<Language, string> = {
  hinglish: "en",
  hi: "hi",
  en: "en",
};

export const dictionaries: Record<Language, Dictionary> = {
  hinglish,
  hi,
  en,
};

export interface LanguageContextValue {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  dictionary: Dictionary;
}

const defaultContextValue: LanguageContextValue = {
  lang: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key: TranslationKey, params?: Record<string, string | number>): string => {
    let text: string = hinglish[key] ?? key;
    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        text = text.replace(new RegExp(`{${pKey}}`, "g"), String(pVal));
      }
    }
    return text;
  },
  dictionary: hinglish,
};

const LanguageContext = createContext<LanguageContextValue>(defaultContextValue);

export interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: Language;
}

/**
 * Validates whether an arbitrary string is a supported Language.
 */
function isValidLanguage(val: unknown): val is Language {
  return val === "hinglish" || val === "hi" || val === "en";
}

/**
 * Updates the document root <html lang="..."> tag safely.
 */
function updateDocumentLang(lang: Language): void {
  if (typeof document !== "undefined" && document.documentElement) {
    const targetTag = HTML_LANG_MAP[lang] ?? "en";
    document.documentElement.lang = targetTag;
  }
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("cleansaans_lang_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("cleansaans_lang_change", callback);
  };
}

function getSnapshot(): Language {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isValidLanguage(saved)) return saved;
    }
  } catch {
    // LocalStorage unavailable
  }
  return DEFAULT_LANGUAGE;
}

function getServerSnapshot(): Language {
  return DEFAULT_LANGUAGE;
}

/**
 * SSR-safe LanguageProvider.
 * - Uses useSyncExternalStore for hydration-safe external localStorage subscription.
 * - Defaults to 'hinglish' during SSR to prevent hydration mismatches.
 * - Synchronizes <html lang> attribute with active language.
 */
export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
  const storeLang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [explicitLang, setExplicitLang] = useState<Language | null>(initialLanguage ?? null);

  const lang = explicitLang ?? storeLang;

  // Synchronize document <html lang> with the active language
  useEffect(() => {
    updateDocumentLang(lang);
  }, [lang]);

  const setLanguage = useCallback((newLang: Language) => {
    setExplicitLang(newLang);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, newLang);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cleansaans_lang_change"));
      }
    } catch {
      // LocalStorage unavailable
    }
    updateDocumentLang(newLang);
  }, []);

  const dictionary = useMemo(() => dictionaries[lang] ?? hinglish, [lang]);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const activeDict = dictionaries[lang] ?? hinglish;
      let text: string = activeDict[key] ?? hinglish[key] ?? key;

      if (params) {
        for (const [pKey, pVal] of Object.entries(params)) {
          text = text.replace(new RegExp(`{${pKey}}`, "g"), String(pVal));
        }
      }
      return text;
    },
    [lang]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLanguage,
      t,
      dictionary,
    }),
    [lang, setLanguage, t, dictionary]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/**
 * Hook to consume current translations and language state.
 */
export function useT(): LanguageContextValue {
  return useContext(LanguageContext);
}
