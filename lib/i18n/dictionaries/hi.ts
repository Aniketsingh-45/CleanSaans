import type { Dictionary } from "./hinglish";

/**
 * Hindi dictionary in standard Devanagari script.
 */
export const hi: Dictionary = {
  // Navigation & Branding
  appName: "CleanSaans",
  tagline: "साफ़ सांस, सबके साथ।",
  setupReady: "सेटअप तैयार",
  editProfile: "प्रोफाइल बदलें",

  // Welcome Hero
  welcomeHeading: "नमस्ते! CleanSaans में आपका स्वागत है।",
  welcomeText:
    "यह प्रोजेक्ट सेटअप शेल है। अगले चरणों में लाइव AQI, एक्सपोज़र कैलकुलेशन और परिवार के लिए दैनिक योजना जोड़ी जाएगी।",

  // Safety
  safetyNoteAria: "सुरक्षा सूचना",
  safetyNoteText: "सुरक्षा सूचना: सांस लेने में दिक्कत या सीने में दर्द हो तो तुरंत डॉक्टर से मिलें।",
  footerDisclaimer:
    "यह सिर्फ जानकारी है, डॉक्टर की सलाह नहीं। सांस लेने में दिक्कत या सीने में दर्द हो तो तुरंत डॉक्टर से मिलें।",

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
  sourceCached: "कैश्ड डेटा (Purana)",
  sourceLive: "लाइव डेटा (Taaza)",

  // AQI Card
  aqiCardTitle: "वायु गुणवत्ता की वर्तमान स्थिति",
  pm25Unit: "µg/m³ PM2.5",
  updatedJustNow: "अभी अपडेट हुआ",
  updatedMinAgo: "{min} मिनट पहले अपडेट हुआ",
  updatedHoursAgo: "{hours} घंटे पहले अपडेट हुआ",
  badgeCached: "कैश्ड डेटा",
  badgeLive: "लाइव डेटा",
  aqiRetry: "पुनः प्रयास करें",
  aqiError: "AQI डेटा लोड नहीं हो सका।",
  loadingAqi: "AQI डेटा लोड हो रहा है...",

  // Safe Window Component
  safeWindowTitle: "बाहर जाने का सबसे साफ़ समय",
  safeWindowSubtitle: "वॉक, बच्चों या आवश्यक कार्यों के लिए 24 घंटे में न्यूनतम प्रदूषण का समय चुनें।",
  startTimeLabel: "आपका समय (प्रारंभ समय)",
  durationLabel: "अवधि (समय)",
  durationMinutes: "{min} मिनट ({hours} घंटा)",
  exposureAtThisTime: "इस समय लगभग ~{low} से {high} सिगरेट के बराबर धुआं",
  bestTimeResult: "सबसे साफ़ समय {time}:00, लगभग ~{saved} सिगरेट कम",
  setBestTimeBtn: "Best time set karo",
  sensitiveAvoidWarning:
    "चेतावनी: बच्चों, बुजुर्गों या अस्थमा रोगियों के लिए इस समय बाहर जाना हानिकारक हो सकता है। टालने का प्रयास करें।",
  chartColorNote: "रंग अनुमानित हैं (CPCB 24 घंटे के मानकों के अनुसार)।",
  tableSrTitle: "24 घंटे का PM2.5 और श्रेणी डेटा",
  tableColTime: "समय",
  tableColPm25: "PM2.5 (µg/m³)",
  tableColCategory: "श्रेणी",
  bestWindowBadge: "सबसे साफ़",
  chosenWindowBadge: "चुना हुआ समय",

  // Exposure Comparison (Part b)
  comparisonTitle: "योजना के बिना बनाम योजना के साथ",
  comparisonSubtitle: "स्मॉग एक्सपोज़र में संभावित कमी",
  withoutPlanLabel: "योजना के बिना",
  withPlanLabel: "योजना के साथ",
  cigsPerDay: "~{low} से {high} सिगरेट/दिन",
  percentSavedBadge: "~{percent}% कम धुआं",
  comparisonToggleLabel: "अंतर देखें",
  comparisonViewModePlan: "योजना के साथ बचत देखें",
  comparisonViewModeBaseline: "योजना के बिना एक्सपोज़र देखें",

  // Daily Plan (Part b)
  planSectionTitle: "आज की व्यक्तिगत योजना",
  planSubtitle: "आपके शहर और परिवार के अनुसार 5 आसान कदम।",
  categoryRoutine: "कम उत्सर्जन वाली दैनिक आदतें",
  categoryIndoor: "घर की हवा सुधारने के उपाय",
  categorySustainable: "सस्टेनेबल और सस्ते विकल्प",
  freeBadge: "मुफ़्त (₹0)",
  costBadge: "लगभग ₹{cost}",
  inrSavedChip: "₹{inr} की बचत",
  co2SavedChip: "{co2} किग्रा CO₂ कम",
  cigsSavedChip: "~{cigs} सिगरेट कम",
  kyunBtn: "क्यों?",
  kyunCloseBtn: "बंद करें",
  sourceAiBadge: "AI द्वारा परिष्कृत",
  sourceRulesBadge: "नियम आधारित",
  planLoading: "आपके परिवार के लिए योजना तैयार की जा रही है...",
  planError: "योजना लोड नहीं हो सकी।",
  planRetry: "पुनः प्रयास करें",

  // Onboarding Screen
  onboardingTitle: "अपना परिवार सेटअप करें",
  onboardingSubtitle: "दैनिक स्मॉग एक्सपोज़र कम करने के लिए 1 मिनट में जानकारी भरें।",
  privacyNote: "आपका डेटा सिर्फ आपके फोन में रहता है।",
  legendLocation: "आपका शहर",
  cityLabel: "शहर चुनें",
  citySelectPlaceholder: "-- शहर चुनें --",

  legendFamily: "परिवार के सदस्य",
  kidsLabel: "बच्चों की संख्या (12 वर्ष से कम)",
  elderlyLabel: "बुजुर्गों की संख्या (65 वर्ष से अधिक)",
  asthmaLabel: "क्या घर में किसी को अस्थमा या सांस की समस्या है?",
  yes: "हाँ",
  no: "नहीं",

  legendCommute: "दैनिक आवागमन (Commute)",
  commuteModeLabel: "आवागमन का मुख्य साधन",
  commuteKmLabel: "दैनिक आने-जाने की दूरी (किमी)",
  modeWalk: "पैदल",
  modeCycle: "साइकिल",
  modeBike: "बाइक / स्कूटर",
  modeBus: "बस",
  modeMetro: "मेट्रो / ट्रेन",
  modeCar: "कार",

  legendHome: "घर और रसोई",
  windowsLabel: "खिड़कियां आमतौर पर",
  windowsOpen: "खुली रहती हैं",
  windowsClosed: "बंद रहती हैं",
  purifierLabel: "क्या घर में एयर प्यूरीफायर है?",
  cookingLabel: "खाना पकाने का मुख्य ईंधन",
  cookingLpg: "एलपीजी गैस / पाइप गैस",
  cookingInduction: "इंडक्शन / इलेक्ट्रिक",
  cookingWood: "चूल्हा / लकड़ी / उपले",

  submitButton: "प्रोफाइल सेव करें और प्लान देखें",

  // Validation Errors
  errorCityRequired: "कृपया एक मान्य शहर चुनें।",
  errorKidsInvalid: "बच्चों की संख्या 0 या उससे अधिक होनी चाहिए।",
  errorElderlyInvalid: "बुजुर्गों की संख्या 0 या उससे अधिक होनी चाहिए।",
  errorCommuteKmInvalid: "दूरी 0 किमी या उससे अधिक होनी चाहिए।",
  errorCommuteModeRequired: "कृपया आवागमन का साधन चुनें।",
  errorWindowsRequired: "कृपया खिड़की की स्थिति चुनें।",
  errorCookingRequired: "कृपया खाना पकाने का ईंधन चुनें।",

  // Accessibility & Skip Link (Part c)
  skipToContent: "सीधे मुख्य सामग्री पर जाएं",

  // Assumptions Modal (Part c)
  howCalculatedBtn: "ये संख्याएँ कैसे निकलीं?",
  assumptionsModalTitle: "मॉडलिंग मान्यताएँ और स्रोत",
  assumptionsNote: "अनुमानित आकलन, डॉक्टर की सलाह नहीं",
  closeModal: "बंद करें",
  tableHeaderFactor: "कारक / पैरामीटर",
  tableHeaderValue: "अनुमानित मान",
  tableHeaderSource: "स्रोत संदर्भ",
  tableHeaderNote: "टिप्पणी",

  // Air Audit Feature
  auditNav: "एयर ऑडिट",
  auditPageTitle: "घर का एयर ऑडिट",
  auditPageSubtitle: "अपने कमरे, खिड़की या रसोई की फोटो अपलोड करके प्रदूषण लीक्स खोजें।",
  auditPrivacyNote: "आपकी फोटो केवल विश्लेषण के लिए उपयोग की जाती है और सर्वर पर सुरक्षित नहीं रखी जाती।",
  auditUploadLabel: "कमरे, खिड़की या रसोई की फोटो चुनें",
  auditUploadHint: "JPEG, PNG या WebP (अधिकतम 4MB)",
  auditPreviewAlt: "ऑडिट के लिए अपलोड की गई फोटो का पूर्वावलोकन",
  auditAnalyzeBtn: "फोटो स्कैन करें",
  auditRetakeBtn: "दूसरी फोटो लें",
  auditAnalyzingText: "फोटो का विश्लेषण किया जा रहा है, कृपया प्रतीक्षा करें...",
  auditResultsTitle: "ऑडिट के परिणाम",
  auditResultsSubtitle: "मिले हुए प्रदूषण लीक्स और उन्हें ठीक करने के आसान तरीके।",
  auditEmptyMessage:
    "इस फोटो में कोई प्रदूषण लीक नहीं मिला या फोटो स्पष्ट नहीं है। कृपया अच्छी रोशनी में खिड़की या रसोई की साफ फोटो लेकर पुनः प्रयास करें।",
  auditBurningAlertTitle: "खुले में कूड़ा / बायोमास जलना डिटेक्ट हुआ!",
  auditBurningAlertText:
    "खुले में आग या कूड़ा जलाना गैरकानूनी है। इसे समीर ऐप या स्थानीय 311 हेल्पलाइन पर तुरंत रिपोर्ट करें।",
  auditEffortLabel: "प्रयास",
  auditEffortLow: "कम (आसान)",
  auditEffortMed: "मध्यम",
  auditEffortHigh: "अधिक",
  auditCostLabel: "अनुमानित खर्च",
  auditFixTitle: "आसान समाधान (Fix)",
  auditWhyTitle: "यह क्यों महत्वपूर्ण है",
  auditErrorGeneric: "फोटो का विश्लेषण नहीं हो सका। कृपया पुनः प्रयास करें।",
  auditHomeBannerTitle: "घर का एयर ऑडिट",
  auditHomeBannerDesc: "कमरे या रसोई की फोटो अपलोड करके प्रदूषण लीक्स और कूड़ा जलना डिटेक्ट करें।",
  auditHomeBannerBtn: "फोटो ऑडिट करें",

  // Ask CleanSaans AI
  askSectionTitle: "प्रदूषण और स्वास्थ्य से जुड़ा सवाल पूछें",
  askSectionSubtitle: "CleanSaans AI से विंटर स्मॉग, इनडोर वायु गुणवत्ता और सुरक्षित आदतों के बारे में पूछें।",
  askInputLabel: "अपना सवाल यहाँ लिखें (अधिकतम 500 अक्षर)",
  askPlaceholder: "जैसे: सुबह टहलने का सही समय क्या है? कौन सा मास्क पहनना चाहिए?",
  askCharLimit: "{count}/500 अक्षर",
  askSubmitBtn: "सवाल पूछें",
  askSubmittingBtn: "उत्तर लिखा जा रहा है...",
  askLoadingText: "CleanSaans AI उत्तर तैयार कर रहा है...",
  askDisclaimerNote: "AI जवाब, डॉक्टर की सलाह नहीं।",
  askAnswerTitle: "CleanSaans AI का उत्तर",
  askErrorGeneric: "उत्तर प्राप्त नहीं हो सका। कृपया पुनः प्रयास करें।",
  askBadgeAi: "AI उत्तर",
  askBadgeFallback: "फ़ॉलबैक उत्तर",
  askAnotherBtn: "दूसरा सवाल पूछें",

  // Share Plan
  sharePlanBtn: "प्लान शेयर करें",
  shareOnWhatsApp: "व्हाट्सएप पर शेयर करें",
  sharePlanText:
    "CleanSaans ke plan se main ~{percent}% kam pollution lunga ({baseline} -> {plan} cigarette). Aap bhi try karo: {url}",
};
