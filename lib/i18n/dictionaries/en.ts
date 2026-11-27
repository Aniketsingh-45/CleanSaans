import type { Dictionary } from "./hinglish";

/**
 * English dictionary.
 */
export const en: Dictionary = {
  // Navigation & Branding
  appName: "CleanSaans",
  tagline: "Clean air, together.",
  setupReady: "Setup ready",
  editProfile: "Edit profile",

  // Welcome Hero
  welcomeHeading: "Namaste! Welcome to CleanSaans.",
  welcomeText:
    "This is the initial setup shell. Live AQI, deterministic exposure engine calculations, and personalized daily family smog plans will be connected in upcoming steps.",

  // Safety
  safetyNoteAria: "Safety note",
  safetyNoteText:
    "Safety note: If you experience difficulty breathing or chest pain, consult a doctor immediately.",
  footerDisclaimer:
    "This is informational only, not medical advice. If you experience difficulty breathing or chest pain, consult a doctor immediately.",

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

  // AQI Card
  aqiCardTitle: "Current Air Quality",
  pm25Unit: "µg/m³ PM2.5",
  updatedJustNow: "Updated just now",
  updatedMinAgo: "Updated {min} min ago",
  updatedHoursAgo: "Updated {hours} hours ago",
  badgeCached: "Cached data",
  badgeLive: "Live data",
  aqiRetry: "Retry",
  aqiError: "Unable to load AQI data.",
  loadingAqi: "Loading air quality data...",

  // Safe Window Component
  safeWindowTitle: "Cleanest window for outdoor activity",
  safeWindowSubtitle:
    "Find the 24-hour hours with lowest exposure for walks, school runs, or errands.",
  startTimeLabel: "Your start time",
  durationLabel: "Duration",
  durationMinutes: "{min} min ({hours} hr)",
  exposureAtThisTime: "Exposure at this time: ~{low} to {high} cigarettes equivalent",
  bestTimeResult: "Cleanest window: {time}:00, saving ~{saved} cigarettes",
  setBestTimeBtn: "Best time set karo",
  sensitiveAvoidWarning:
    "Warning: Air quality is poor or worse during this window. Sensitive members (children, elderly, asthma) should avoid outdoor exertion if possible.",
  chartColorNote: "Colors are approximate (based on CPCB 24-hour AQI standards).",
  tableSrTitle: "24-Hour PM2.5 and Category Table",
  tableColTime: "Time",
  tableColPm25: "PM2.5 (µg/m³)",
  tableColCategory: "Category",
  bestWindowBadge: "Cleanest",
  chosenWindowBadge: "Chosen time",

  // Exposure Comparison (Part b)
  comparisonTitle: "Without Plan vs With Plan",
  comparisonSubtitle: "Estimated reduction in smog exposure",
  withoutPlanLabel: "Without plan",
  withPlanLabel: "With plan",
  cigsPerDay: "~{low} to {high} cigarettes/day",
  percentSavedBadge: "~{percent}% less exposure",
  comparisonToggleLabel: "Toggle comparison view",
  comparisonViewModePlan: "View savings with plan",
  comparisonViewModeBaseline: "View exposure without plan",

  // Daily Plan (Part b)
  planSectionTitle: "Today's Personalized Plan",
  planSubtitle: "5 simple daily actions customized for your family.",
  categoryRoutine: "Low-emission daily routines",
  categoryIndoor: "Indoor air quality hacks",
  categorySustainable: "Sustainable alternatives",
  freeBadge: "Free (₹0)",
  costBadge: "Approx ₹{cost}",
  inrSavedChip: "Save ₹{inr}",
  co2SavedChip: "{co2} kg CO₂ reduced",
  cigsSavedChip: "~{cigs} cigs saved",
  kyunBtn: "Why?",
  kyunCloseBtn: "Close",
  sourceAiBadge: "AI Polished",
  sourceRulesBadge: "Rules-based",
  planLoading: "Creating personalized plan for your family...",
  planError: "Unable to generate plan.",
  planRetry: "Retry",

  // Onboarding Screen
  onboardingTitle: "Set Up Your Family Profile",
  onboardingSubtitle: "Take 1 minute to personalize daily clean air actions for your family.",
  privacyNote: "Your data stays only on your phone.",
  legendLocation: "Your City",
  cityLabel: "Select city",
  citySelectPlaceholder: "-- Select a city --",

  legendFamily: "Family Members",
  kidsLabel: "Number of children (under 12)",
  elderlyLabel: "Number of senior citizens (65+)",
  asthmaLabel: "Does anyone at home have asthma or breathing issues?",
  yes: "Yes",
  no: "No",

  legendCommute: "Daily Commute",
  commuteModeLabel: "Primary commute mode",
  commuteKmLabel: "Daily travel distance (km)",
  modeWalk: "Walk",
  modeCycle: "Cycle",
  modeBike: "Motorcycle / Scooter",
  modeBus: "Bus",
  modeMetro: "Metro / Train",
  modeCar: "Car",

  legendHome: "Home & Cooking Habits",
  windowsLabel: "Windows are usually",
  windowsOpen: "Usually open",
  windowsClosed: "Usually closed",
  purifierLabel: "Do you have an air purifier at home?",
  cookingLabel: "Primary cooking fuel",
  cookingLpg: "LPG Gas / Piped Natural Gas",
  cookingInduction: "Induction / Electric",
  cookingWood: "Wood / Chulha / Biomass",

  submitButton: "Save Profile and View Plan",

  // Validation Errors
  errorCityRequired: "Please select a valid city.",
  errorKidsInvalid: "Children count must be 0 or greater.",
  errorElderlyInvalid: "Senior citizens count must be 0 or greater.",
  errorCommuteKmInvalid: "Distance must be 0 km or greater.",
  errorCommuteModeRequired: "Please select a commute mode.",
  errorWindowsRequired: "Please select window habit.",
  errorCookingRequired: "Please select cooking fuel.",

  // Accessibility & Skip Link (Part c)
  skipToContent: "Skip to main content",

  // Assumptions Modal (Part c)
  howCalculatedBtn: "How were these numbers calculated?",
  assumptionsModalTitle: "Modelling Assumptions & Sources",
  assumptionsNote: "approximate estimate, not medical advice",
  closeModal: "Close",
  tableHeaderFactor: "Factor / Parameter",
  tableHeaderValue: "Approx Value",
  tableHeaderSource: "Source Citation",
  tableHeaderNote: "Note",

  // Air Audit Feature
  auditNav: "Air Audit",
  auditPageTitle: "Home Air Audit",
  auditPageSubtitle:
    "Upload a photo of your room, window, or kitchen to detect air pollution leaks.",
  auditPrivacyNote: "Your photo is processed only for analysis and is never stored on any server.",
  auditUploadLabel: "Select room, window, or kitchen photo",
  auditUploadHint: "JPEG, PNG, or WebP (Max 4MB)",
  auditPreviewAlt: "Uploaded photo preview for air audit",
  auditAnalyzeBtn: "Scan Photo",
  auditRetakeBtn: "Choose another photo",
  auditAnalyzingText: "Analyzing photo for pollution leaks, please wait...",
  auditResultsTitle: "Audit Results",
  auditResultsSubtitle: "Detected pollution leaks and recommended practical solutions.",
  auditEmptyMessage:
    "No pollution leaks detected in this photo, or the photo is unclear. Please take a clear photo of your window, door, or kitchen in good lighting.",
  auditBurningAlertTitle: "Open waste / biomass burning detected!",
  auditBurningAlertText:
    "Burning waste or biomass is illegal and releases extreme PM2.5 concentrations. Please report open burning on the Sameer App or local 311 helpline.",
  auditEffortLabel: "Effort",
  auditEffortLow: "Low effort",
  auditEffortMed: "Medium effort",
  auditEffortHigh: "High effort",
  auditCostLabel: "Est. Cost",
  auditFixTitle: "Recommended Fix",
  auditWhyTitle: "Why it matters",
  auditErrorGeneric: "Failed to analyze photo. Please try again.",
  auditHomeBannerTitle: "Home Air Audit",
  auditHomeBannerDesc: "Upload a room or kitchen photo to detect pollution leaks and burning.",
  auditHomeBannerBtn: "Audit Photo",

  // Ask CleanSaans AI
  askSectionTitle: "Ask CleanSaans About Habits & Air Quality",
  askSectionSubtitle:
    "Ask our AI helper for practical winter smog advice and healthy daily routines.",
  askInputLabel: "Type your question here (max 500 characters)",
  askPlaceholder: "e.g., Should I go for a morning run? Which mask is effective for PM2.5?",
  askCharLimit: "{count}/500 chars",
  askSubmitBtn: "Ask CleanSaans",
  askSubmittingBtn: "Formulating answer...",
  askLoadingText: "CleanSaans AI is preparing your answer...",
  askDisclaimerNote: "AI answer, not medical advice.",
  askAnswerTitle: "CleanSaans AI Answer",
  askErrorGeneric: "Could not retrieve answer. Please try again.",
  askBadgeAi: "AI Answer",
  askBadgeFallback: "Fallback Answer",
  askAnotherBtn: "Ask another question",

  // Share Plan
  sharePlanBtn: "Share Plan",
  shareOnWhatsApp: "Share on WhatsApp",
  sharePlanText:
    "CleanSaans ke plan se main ~{percent}% kam pollution lunga ({baseline} -> {plan} cigarette). Aap bhi try karo: {url}",
};
