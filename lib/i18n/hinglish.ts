/**
 * Default dictionary: Simple everyday Hinglish as spoken in northern Indian cities.
 */
export const hinglish = {
  // Navigation & Branding
  appName: "CleanSaans",
  tagline: "Saaf saans, sabke saath.",
  setupReady: "Setup taiyaar",

  // Welcome Hero
  welcomeHeading: "Namaste! CleanSaans mein aapka swagat hai.",
  welcomeText:
    "Yeh project setup shell hai. Agle steps mein live AQI, deterministic exposure engine aur parivar ke liye roz ka simple Hinglish plan joda jayega.",

  // Safety
  safetyNoteAria: "Safety note",
  safetyNoteText:
    "Safety note: Saans lene mein dikkat ya seene mein dard ho to turant doctor se milein.",
  footerDisclaimer:
    "CleanSaans: sirf jaankari ke liye, doctor ki salah nahi. Sabhi numbers approximate hain.",

  // Language Selector
  languageToggleAria: "Bhasha chunein",
  languageHinglish: "Hinglish",
  languageHindi: "हिंदी",
  languageEnglish: "English",

  // Common UI & AQI
  aqiLabel: "Live AQI",
  approxDisclaimer: "Sabhi numbers anumaanit hain",
  howCalculated: "Ye numbers kaise nikle?",
  doctorAdviceDisclaimer:
    "Doctor ki salah nahi hai. Seene mein dard ya saans phoolne par turant doctor se milein.",
  sourceCached: "Puraana data",
  sourceLive: "Taza data",
} as const;

export type TranslationKey = keyof typeof hinglish;
export type Dictionary = Record<TranslationKey, string>;
