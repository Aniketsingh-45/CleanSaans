import type { Dictionary } from "./hinglish";

/**
 * Hindi dictionary in standard Devanagari script.
 */
export const hi: Dictionary = {
  // Navigation & Branding
  appName: "CleanSaans",
  tagline: "साफ़ सांस, सबके साथ।",
  setupReady: "सेटअप तैयार",

  // Welcome Hero
  welcomeHeading: "नमस्ते! CleanSaans में आपका स्वागत है।",
  welcomeText:
    "यह प्रोजेक्ट सेटअप शेल है। अगले चरणों में लाइव AQI, एक्सपोज़र कैलकुलेशन और परिवार के लिए दैनिक योजना जोड़ी जाएगी।",

  // Safety
  safetyNoteAria: "सुरक्षा सूचना",
  safetyNoteText: "सुरक्षा सूचना: सांस लेने में दिक्कत या सीने में दर्द हो तो तुरंत डॉक्टर से मिलें।",
  footerDisclaimer: "CleanSaans: सिर्फ जानकारी के लिए, डॉक्टर की सलाह नहीं। सभी संख्याएं अनुमानित हैं।",

  // Language Selector
  languageToggleAria: "भाषा चुनें",
  languageHinglish: "Hinglish",
  languageHindi: "हिंदी",
  languageEnglish: "English",

  // Common UI & AQI
  aqiLabel: "लाइव AQI",
  approxDisclaimer: "सभी संख्याएं अनुमानित हैं",
  howCalculated: "यह संख्याएं कैसे निकाली गईं?",
  doctorAdviceDisclaimer: "डॉक्टर की सलाह नहीं है। सीने में दर्द या सांस फूलने पर तुरंत डॉक्टर से मिलें।",
  sourceCached: "कैश्ड डेटा",
  sourceLive: "लाइव डेटा",
};
