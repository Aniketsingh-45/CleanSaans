import type { Dictionary } from "./hinglish";

/**
 * English dictionary.
 */
export const en: Dictionary = {
  // Navigation & Branding
  appName: "CleanSaans",
  tagline: "Clean air, together.",
  setupReady: "Setup ready",

  // Welcome Hero
  welcomeHeading: "Namaste! Welcome to CleanSaans.",
  welcomeText:
    "This is the initial setup shell. Live AQI, deterministic exposure engine calculations, and personalized daily family smog plans will be connected in upcoming steps.",

  // Safety
  safetyNoteAria: "Safety note",
  safetyNoteText:
    "Safety note: If you experience difficulty breathing or chest pain, consult a doctor immediately.",
  footerDisclaimer:
    "CleanSaans: For informational purposes only, not medical advice. All numbers are approximations.",

  // Language Selector
  languageToggleAria: "Select language",
  languageHinglish: "Hinglish",
  languageHindi: "हिंदी",
  languageEnglish: "English",

  // Common UI & AQI
  aqiLabel: "Live AQI",
  approxDisclaimer: "All numbers are approximations",
  howCalculated: "How are these numbers calculated?",
  doctorAdviceDisclaimer:
    "Not medical advice. For chest pain or shortness of breath, consult a doctor immediately.",
  sourceCached: "Cached data",
  sourceLive: "Live data",
};
