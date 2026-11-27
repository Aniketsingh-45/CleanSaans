/**
 * Default dictionary: Simple everyday Hinglish as spoken in northern Indian cities.
 */
export const hinglish = {
  // Navigation & Branding
  appName: "CleanSaans",
  tagline: "Saaf saans, sabke saath.",
  setupReady: "Setup taiyaar",
  editProfile: "Profile badlein",

  // Welcome Hero
  welcomeHeading: "Namaste! CleanSaans mein aapka swagat hai.",
  welcomeText:
    "Yeh project setup shell hai. Agle steps mein live AQI, deterministic exposure engine aur parivar ke liye roz ka simple Hinglish plan joda jayega.",

  // Safety
  safetyNoteAria: "Safety note",
  safetyNoteText:
    "Safety note: Saans lene mein dikkat ya seene mein dard ho to turant doctor se milein.",
  footerDisclaimer:
    "Ye sirf jaankari hai, doctor ki salah nahi. Saans lene mein dikkat ya seene mein dard ho to turant doctor se milein.",

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
  sourceCached: "Purana data (Cached)",
  sourceLive: "Taza data (Live)",

  // AQI Card
  aqiCardTitle: "Hawa ki taaza sthiti",
  pm25Unit: "µg/m³ PM2.5",
  updatedJustNow: "Abhi update hua",
  updatedMinAgo: "{min} min pehle update hua",
  updatedHoursAgo: "{hours} ghante pehle update hua",
  badgeCached: "Cached data",
  badgeLive: "Live data",
  aqiRetry: "Dobara koshish karein",
  aqiError: "AQI data load nahi ho paya.",
  loadingAqi: "AQI data load ho raha hai...",

  // Safe Window Component
  safeWindowTitle: "Bahar jaane ka sabse saaf time",
  safeWindowSubtitle:
    "Walk, bachhon ke khelne ya zaroori kaam ke liye 24 ghante mein sabse kam smog wala time chunein.",
  startTimeLabel: "Aapka samay (Start Time)",
  durationLabel: "Bahar bitane ka samay (Duration)",
  durationMinutes: "{min} min ({hours} ghanta)",
  exposureAtThisTime: "Is time par ~{low} se {high} cigarette barabar dhuan",
  bestTimeResult: "Sabse saaf time {time}:00, lagbhag ~{saved} cigarette kam",
  setBestTimeBtn: "Best time set karo",
  sensitiveAvoidWarning:
    "Warning: Bachon, buzurgon ya asthma walon ke liye is samay hawa bahut kharab hai. Bahar jaana avoid karein.",
  chartColorNote: "Rang approximate hain (CPCB 24-hr bands ke aadhar par).",
  tableSrTitle: "24 Ghante ka PM2.5 aur Category Data",
  tableColTime: "Samay",
  tableColPm25: "PM2.5 (µg/m³)",
  tableColCategory: "Category",
  bestWindowBadge: "Sabse saaf",
  chosenWindowBadge: "Chuna hua",

  // Exposure Comparison (Part b)
  comparisonTitle: "Bina plan vs Plan ke saath",
  comparisonSubtitle: "Smog exposure mein lagbhag kitna farak padega",
  withoutPlanLabel: "Bina plan ke",
  withPlanLabel: "Plan ke saath",
  cigsPerDay: "~{low} se {high} cigarette/din",
  percentSavedBadge: "~{percent}% kam dhuan",
  comparisonToggleLabel: "Farak dekhein (Compare)",
  comparisonViewModePlan: "Plan ke sath bachat dekhein",
  comparisonViewModeBaseline: "Bina plan ka dhuan dekhein",

  // Daily Plan (Part b)
  planSectionTitle: "Aaj ka personalized plan",
  planSubtitle: "Aapke shehar aur parivar ke anusaar 5 asaan kadam.",
  categoryRoutine: "Low-emission daily routines",
  categoryIndoor: "Indoor air quality hacks",
  categorySustainable: "Sustainable alternatives",
  freeBadge: "Muft (₹0)",
  costBadge: "Lagbhag ₹{cost}",
  inrSavedChip: "₹{inr} bachega",
  co2SavedChip: "{co2} kg CO₂ kam",
  cigsSavedChip: "~{cigs} cigs kam",
  kyunBtn: "Kyun?",
  kyunCloseBtn: "Band karein",
  sourceAiBadge: "AI Polish",
  sourceRulesBadge: "Rules-based",
  planLoading: "Aapke parivar ke liye plan ban raha hai...",
  planError: "Plan load nahi ho paya.",
  planRetry: "Dobara koshish karein",

  // Onboarding Screen
  onboardingTitle: "Apna Parivar Setup Karein",
  onboardingSubtitle: "Roz ka smog exposure kam karne ke liye 1 minute mein apni jaankari bharein.",
  privacyNote: "Aapka data sirf aapke phone mein rehta hai.",
  legendLocation: "Aapka Shehar",
  cityLabel: "Shehar chunein",
  citySelectPlaceholder: "-- Shehar chunein --",

  legendFamily: "Parivar ke Sadasya",
  kidsLabel: "Bachhon ki sankhya (12 saal se kam)",
  elderlyLabel: "Buzurgon ki sankhya (65 saal se zyada)",
  asthmaLabel: "Ghar mein kisi ko asthma ya saans ki bimari hai?",
  yes: "Haan",
  no: "Nahi",

  legendCommute: "Roz ka Aana-Jaana (Commute)",
  commuteModeLabel: "Commute ka sadhan",
  commuteKmLabel: "Roz aane-jaane ki doori (km)",
  modeWalk: "Paidhal (Walk)",
  modeCycle: "Cycle",
  modeBike: "Bike / Scooter",
  modeBus: "Bus",
  modeMetro: "Metro / Train",
  modeCar: "Car",

  legendHome: "Ghar aur Rasoi",
  windowsLabel: "Khidkiyan aamtaur par",
  windowsOpen: "Khuli rehti hain (Usually open)",
  windowsClosed: "Band rehti hain (Usually closed)",
  purifierLabel: "Ghar mein Air Purifier hai?",
  cookingLabel: "Khana banane ka fuel",
  cookingLpg: "LPG Gas Cylinder / Piped Gas",
  cookingInduction: "Induction / Electric",
  cookingWood: "Chulha / Wood / Biomass",

  submitButton: "Profile Save Karein aur Plan Dekhein",

  // Validation Errors
  errorCityRequired: "Kripya shehar chunein.",
  errorKidsInvalid: "Bachhon ki sankhya 0 ya usse zyada honi chahiye.",
  errorElderlyInvalid: "Buzurgon ki sankhya 0 ya usse zyada honi chahiye.",
  errorCommuteKmInvalid: "Commute km 0 ya usse zyada hona chahiye.",
  errorCommuteModeRequired: "Kripya commute ka tareeka chunein.",
  errorWindowsRequired: "Khidkiyon ki aadat chunein.",
  errorCookingRequired: "Khana banane ka fuel chunein.",

  // Accessibility & Skip Link (Part c)
  skipToContent: "Content par seedhe jayein (Skip to content)",

  // Assumptions Modal (Part c)
  howCalculatedBtn: "Ye numbers kaise nikle?",
  assumptionsModalTitle: "Modelling Assumptions & Sources",
  assumptionsNote: "approximate estimate, not medical advice",
  closeModal: "Band karein",
  tableHeaderFactor: "Factor / Parameter",
  tableHeaderValue: "Approx Value",
  tableHeaderSource: "Source Citation",
  tableHeaderNote: "Note",

  // Air Audit Feature
  auditNav: "Air Audit",
  auditPageTitle: "Ghar ka Air Audit",
  auditPageSubtitle:
    "Apne kamre, khidki ya rasoi ki photo upload karein aur pollution leaks dhoondhein.",
  auditPrivacyNote:
    "Aapki photo sirf analysis ke liye process hoti hai aur server par save nahi hoti.",
  auditUploadLabel: "Ghar ke kamre, khidki ya rasoi ki photo chunein",
  auditUploadHint: "JPEG, PNG ya WebP (Max 4MB)",
  auditPreviewAlt: "Audit ke liye upload ki gayi photo ka preview",
  auditAnalyzeBtn: "Photo Scan Karein",
  auditRetakeBtn: "Doosri photo lein",
  auditAnalyzingText: "Photo ka analysis ho raha hai, kripya intezar karein...",
  auditResultsTitle: "Audit ke Natije",
  auditResultsSubtitle: "Pata chale pollution leaks aur unhe theek karne ke asaan tareeqe.",
  auditEmptyMessage:
    "Is photo mein koi pollution leak nahi mila ya photo saaf nahi hai. Kripya khidki, darwaze ya rasoi ki achhi roshni mein photo kheench kar dobara koshish karein.",
  auditBurningAlertTitle: "Khule mein kooda / dhuan jalna detect hua!",
  auditBurningAlertText:
    "Khule mein aag ya kooda jalana illegal hai aur bohot zyada PM2.5 failata hai. Ise Sameer app ya municipal 311 helpline par turant report karein.",
  auditEffortLabel: "Effort",
  auditEffortLow: "Kam (Low)",
  auditEffortMed: "Madhyam (Med)",
  auditEffortHigh: "Zyada (High)",
  auditCostLabel: "Kharch",
  auditFixTitle: "Asaan Solution (Fix)",
  auditWhyTitle: "Kyun zaroori hai",
  auditErrorGeneric: "Photo analyze nahi ho payi. Kripya dobara koshish karein.",
  auditHomeBannerTitle: "Ghar ka Air Audit",
  auditHomeBannerDesc:
    "Kamre ya rasoi ki photo upload karke pollution leaks aur kooda jalna detect karein.",
  auditHomeBannerBtn: "Photo Audit Karein",

  // Ask CleanSaans AI
  askSectionTitle: "Hawa aur Sehat se juda sawaal poochein",
  askSectionSubtitle:
    "CleanSaans AI se winter smog, indoor air aur safe habits ke baare mein poochein.",
  askInputLabel: "Apna sawaal yahan likhein (max 500 akshar)",
  askPlaceholder: "Jaise: Subah walk par jana chahiye ya nahi? Mask kaunsa pehnein?",
  askCharLimit: "{count}/500 akshar",
  askSubmitBtn: "Sawaal Poochein",
  askSubmittingBtn: "Jawab likh rahe hain...",
  askLoadingText: "CleanSaans AI jawab taiyaar kar raha hai...",
  askDisclaimerNote: "AI jawab, doctor ki salah nahi.",
  askAnswerTitle: "CleanSaans AI ka Jawab",
  askErrorGeneric: "Jawab prapt nahi ho saka. Kripya dobara koshish karein.",
  askBadgeAi: "AI Jawab",
  askBadgeFallback: "Fallback Jawab",
  askAnotherBtn: "Doosra sawaal poochein",

  // Share Plan
  sharePlanBtn: "Plan Share Karein",
  shareOnWhatsApp: "WhatsApp par share karein",
  sharePlanText:
    "CleanSaans ke plan se main ~{percent}% kam pollution lunga ({baseline} -> {plan} cigarette). Aap bhi try karo: {url}",
};

export type TranslationKey = keyof typeof hinglish;
export type Dictionary = Record<TranslationKey, string>;
