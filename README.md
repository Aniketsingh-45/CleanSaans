# CleanSaans 🍃

> **Saaf saans, sabke saath.**  
> A mobile-first, privacy-focused winter smog assistant designed for Indian families.

[![CI Status](https://img.shields.io/badge/CI-Passing-emerald?style=flat-square)](https://github.com/Aniketsingh-45/CleanSaans/actions)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.1-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-100%25%20Passing-amber?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-teal?style=flat-square)](https://www.w3.org/WAI/standards-guidelines/wcag/)

---

## 📖 Overview

During winter months across Northern India (Indo-Gangetic Plain), severe smog and PM2.5 levels reach hazardous concentrations (often 300–800+ µg/m³). **CleanSaans** empowers urban families with:

1. **Accurate Live AQI:** Real-time data from Open-Meteo and WAQI mapped directly to official Indian Central Pollution Control Board (CPCB) categories.
2. **Deterministic Exposure Calculation:** Mathematical translation of PM2.5 exposure into intuitive, understandable metrics (~cigarettes/day, following peer-reviewed Berkeley Earth methodology).
3. **Cleanest Window Finder:** 24-hour hourly timeline pinpointing the safest hours of the day to ventilate or venture outdoors.
4. **Personalized 5-Action Plan:** Zero/low-cost daily routines, indoor air quality hacks, and transit alternatives with strict anti-tampering AI safeguards.
5. **Local-First Privacy:** All profile data resides exclusively inside the user's browser `localStorage`—zero server-side user tracking.
6. **Household Air Audit:** Mobile camera scan with client-side compression, magic-byte security, zero-storage policy, and Gemini Vision detection for pollution leaks and open waste burning.
7. **PWA & Offline Shell:** Installable progressive web app with Web Share API integration (WhatsApp fallback), teal theme, and a zero-API-cache service worker.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Data Sources
        OM[Open-Meteo Air Quality API]
        WQ[WAQI Live Station Feed]
    end

    subgraph Server-Side Core
        AQI_API["/api/aqi (60 req/min)"]
        PLAN_API["/api/plan (20 req/min)"]
        AUDIT_API["/api/audit (20 req/min)"]
        ASK_API["/api/ask (20 req/min)"]
        SEC[Rate Limiter & Zod Validator]
        IMG_SEC[Magic Byte Validator (JPEG/PNG/WebP)]
        ENG["Deterministic Engine (/lib/engine)"]
        GEMINI["Google Gemini API (Flash Model)"]
        RULES["Fallback Rules Templates"]
    end

    subgraph Client Application
        ONBOARDING["/onboarding (Family Profile)"]
        HOME["/ (Home Dashboard)"]
        AUDIT_UI["/audit (Household Air Audit)"]
        AQI_CARD["AqiCard (Live CPCB Bands)"]
        WINDOW["SafeWindow (24h Timeline)"]
        COMPARE["ExposureComparison (Animated Drop)"]
        PLAN["DailyPlan (3 Categorized Groups)"]
        MODAL["AssumptionsModal (Transparent Citations)"]
    end

    OM --> AQI_API
    WQ --> AQI_API
    SEC --> AQI_API
    SEC --> PLAN_API
    SEC --> AUDIT_API
    SEC --> ASK_API
    IMG_SEC --> AUDIT_API
    AQI_API --> ENG
    ENG --> PLAN_API
    PLAN_API --> GEMINI
    AUDIT_API --> GEMINI
    ASK_API --> GEMINI
    GEMINI -.Anti-Tamper Validation Failed.-> RULES
    RULES --> PLAN_API
    GEMINI -.Valid.-> PLAN_API

    ONBOARDING -.Local-Only Storage.-> HOME
    HOME -.Link.-> AUDIT_UI
    AQI_API --> AQI_CARD
    AQI_API --> WINDOW
    PLAN_API --> COMPARE
    PLAN_API --> PLAN
    ENG --> MODAL
```

---

## 🔒 Security & Privacy Architecture

- **In-Memory Sliding Window Rate Limiting (`/lib/security/rateLimit.ts`):** Keyed by client IP (`x-forwarded-for` first entry, fallback `"unknown"`). Configurable limits (`/api/aqi` 60/min, `/api/plan` 20/min, `/api/audit` 20/min) with automated garbage collection preventing memory leaks. Returns HTTP `429 Too Many Requests` with a valid `Retry-After` header.
- **Strict Payload & File Validation (`/lib/security/validate.ts`, `/lib/security/image.ts`):** Enforces 100KB JSON limits on JSON APIs and 4MB on multipart image uploads. Verifies real binary magic bytes for JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), and WebP (`RIFF...WEBP`) rather than trusting spoofable MIME headers.
- **Hardened Content-Security-Policy (CSP):** Configured in `next.config.ts` enforcing `default-src 'self'`, strict frame ancestors (`frame-ancestors 'none'`), image permissions (`img-src 'self' data: blob:`), service worker permissions (`worker-src 'self'`), manifest permissions (`manifest-src 'self'`), and strict `Permissions-Policy`.
- **Zero-Logging & Zero-Storage Policy:** Never logs or stores API keys, Gemini tokens, request payloads, user coordinates, or uploaded household images.

---

## 🌐 Lightweight i18n Architecture

CleanSaans features a zero-dependency, SSR-safe typed internationalization layer (`/lib/i18n`):

- **Default:** Everyday Hinglish (`hinglish.ts`) as spoken across Delhi-NCR and northern urban hubs.
- **Hindi (Devanagari):** Formal, accessible Hindi (`hi.ts`).
- **English:** Global English (`en.ts`).
- Automatically syncs with `localStorage` and updates document `<html lang>` attribute dynamically (`"en"` for Hinglish/English, `"hi"` for Hindi).

---

## ♿ Accessibility (WCAG 2.1 AA)

- **Semantic Landmarks:** `<header>`, `<main id="main-content">`, `<footer role="contentinfo">`, `<section>`, `<article>`.
- **Skip to Content:** Accessible skip link visible upon keyboard focus navigation.
- **Accessible Dialogs:** Assumptions modal incorporates `role="dialog"`, `aria-modal="true"`, focus-trapping (cycling Tab/Shift+Tab), Escape key dismissal, and focus restoration to the trigger button.
- **Color Independence:** Air quality categories always render with explicit text labels (e.g., _"Very Poor"_, _"Severe"_), never relying on color alone.
- **Screen Reader Support:** SafeWindow timeline includes a hidden data table (`.sr-only`) providing hourly readings to assistive technologies.
- **Motion Preferences:** Respects `prefers-reduced-motion` across all CSS transitions and animations.

---

## 📂 Project Directory Structure

```text
CleanSaans/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI (Lint, Typecheck, Format, Vitest, Build)
├── app/
│   ├── api/
│   │   ├── aqi/
│   │   │   ├── route.ts       # Rate-limited Open-Meteo & WAQI aggregator
│   │   │   └── route.test.ts  # Endpoint unit & integration tests
│   │   ├── audit/
│   │   │   ├── route.ts       # Magic-byte checked Gemini Vision leak detection
│   │   │   └── route.test.ts  # Vision audit endpoint tests
│   │   ├── ask/
│   │   │   ├── route.ts       # Rate-limited CleanSaans AI habit helper route
│   │   │   └── route.test.ts  # Endpoint injection, symptoms & fallback tests
│   │   └── plan/
│   │       ├── route.ts       # Engine comparison & Gemini anti-tamper plan route
│   │       └── route.test.ts  # Endpoint unit & mock tests
│   ├── audit/
│   │   ├── page.tsx           # Mobile camera capture & leak audit page
│   │   └── page.test.tsx      # Air audit UI tests
│   ├── onboarding/
│   │   ├── page.tsx           # Mobile-first family profile questionnaire
│   │   └── page.test.tsx      # Form validation & localStorage tests
│   ├── error.tsx              # Root Next.js error boundary
│   ├── loading.tsx            # Root Next.js loading skeleton
│   ├── not-found.tsx          # Accessible 404 handler
│   ├── layout.tsx             # Root layout with LanguageProvider & SEO metadata
│   ├── page.tsx               # Main dashboard shell (Parts a, b, c)
│   └── page.test.tsx          # Comprehensive home integration tests
├── components/
│   ├── aqi/
│   │   ├── AqiCard.tsx            # Live AQI card with CPCB badge & relative time
│   │   ├── SafeWindow.tsx         # 24-hr interactive cleanest outdoor window timeline
│   │   └── index.ts               # AQI components barrel
│   ├── assumptions/
│   │   ├── AssumptionsModal.tsx   # Accessible methodology modal with focus trap
│   │   └── index.ts               # Assumptions modal barrel
│   ├── common/
│   │   ├── LanguageToggle.tsx     # Accessible header language selector
│   │   └── index.ts               # Common components barrel
│   ├── plan/
│   │   ├── DailyPlan.tsx          # 5-action daily plan grouped into 3 sections
│   │   ├── ExposureComparison.tsx # Bina plan vs Plan ke saath animated comparison
│   │   └── index.ts               # Plan components barrel
│   ├── AskBox.tsx                 # Accessible question & answer box with safety disclaimer
│   ├── AskBox.test.tsx            # AskBox component interaction tests
│   ├── ShareButton.tsx            # Web Share API & WhatsApp plan share button
│   ├── ShareButton.test.tsx       # Share button integration tests
│   └── index.ts                   # Centralized components barrel export
├── lib/
│   ├── data/
│   │   ├── aqi.ts                 # Air quality schemas, caching & Open-Meteo parsing
│   │   ├── ask.ts                 # CleanSaans AI habit helper schemas, prompt & fallbacks
│   │   ├── audit.ts               # Gemini Vision audit schema & prompt handling
│   │   ├── cities.ts              # Supported Indian city coordinates & metadata
│   │   ├── cpcb.ts                # Official CPCB AQI breakpoints & categories
│   │   ├── plan.ts                # Daily plan schemas, engine connector & AI prompts
│   │   └── index.ts               # Data barrel export
│   ├── engine/
│   │   ├── index.ts               # Exposure calculations, cigarette equivalence & ASSUMPTIONS
│   │   └── window.ts              # Cleanest activity window optimization algorithms
│   ├── i18n/
│   │   ├── dictionaries/
│   │   │   ├── en.ts              # English dictionary
│   │   │   ├── hi.ts              # Hindi (Devanagari) dictionary
│   │   │   ├── hinglish.ts        # Everyday Hinglish dictionary
│   │   │   └── index.ts           # Dictionaries barrel
│   │   ├── provider.tsx           # SSR-safe LanguageProvider & useT hook
│   │   └── index.ts               # i18n barrel export
│   ├── profile/
│   │   ├── profile.ts             # Profile schema & localStorage persistence
│   │   └── index.ts               # Profile barrel export
│   ├── security/
│   │   ├── image.ts               # Magic byte binary inspection (JPEG/PNG/WebP)
│   │   ├── rateLimit.ts           # Sliding window IP rate limiter with auto-cleanup
│   │   ├── validate.ts            # 100KB JSON parser & Zod validator
│   │   └── index.ts               # Security barrel export
│   └── index.ts                   # Core library barrel export
├── next.config.ts             # Next.js configuration with hardened CSP
├── package.json               # Dependencies and scripts
├── tailwind.config.ts         # Tailwind CSS styling tokens
├── tsconfig.json              # Strict TypeScript configuration
└── vitest.config.ts           # Vitest environment setup
```

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: `v22.12.0` or higher (Node 22 / 24 recommended)
- **Package Manager**: `npm` (v10+)

### Installation

```bash
git clone https://github.com/Aniketsingh-45/CleanSaans.git
cd CleanSaans
npm install
```

### Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Optional WAQI Station Token for live station overrides
WAQI_TOKEN=your_waqi_api_token_here

# Google Gemini API key for personalized plan text generation
GEMINI_API_KEY=your_gemini_api_key_here

# Recommended Gemini model (defaults to gemini-2.5-flash)
GEMINI_MODEL=gemini-2.5-flash
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Testing Commands

CleanSaans adheres to a strict multi-tier verification pipeline:

```bash
# 1. Format code with Prettier
npm run format

# 2. Check code style adherence
npm run format:check

# 3. Static analysis with ESLint
npm run lint

# 4. TypeScript strict type validation
npm run typecheck

# 5. Run complete Vitest suite (21 test files, 137 tests)
npm test

# 6. Build optimized production bundle
npm run build
```

---

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
