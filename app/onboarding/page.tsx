"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type JSX } from "react";
import {
  ArrowRightIcon,
  BusIcon,
  CarIcon,
  CycleIcon,
  HomeIcon,
  LeafIcon,
  MapPinIcon,
  MotorcycleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrainIcon,
  UserEditIcon,
  WalkIcon,
} from "@/components/common/Icons";
import { CITY_NAMES, type CityName } from "@/lib/data/cities";
import { LanguageToggle, useT, type TranslationKey } from "@/lib/i18n";
import {
  COMMUTE_MODES,
  COOKING_OPTIONS,
  loadProfile,
  saveProfile,
  UserProfileSchema,
  WINDOW_OPTIONS,
  type CommuteMode,
  type CookingOption,
  type WindowOption,
} from "@/lib/profile";

interface FormErrors {
  city?: string;
  kids?: string;
  elderly?: string;
  commuteMode?: string;
  commuteKm?: string;
  windows?: string;
  cooking?: string;
}

const COMMUTE_MODE_LABEL_KEYS: Record<CommuteMode, TranslationKey> = {
  walk: "modeWalk",
  cycle: "modeCycle",
  bike: "modeBike",
  bus: "modeBus",
  metro: "modeMetro",
  car: "modeCar",
};

const COMMUTE_ICONS: Record<CommuteMode, (props: { className?: string }) => JSX.Element> = {
  walk: WalkIcon,
  cycle: CycleIcon,
  bike: MotorcycleIcon,
  bus: BusIcon,
  metro: TrainIcon,
  car: CarIcon,
};

const COOKING_LABEL_KEYS: Record<CookingOption, TranslationKey> = {
  lpg: "cookingLpg",
  induction: "cookingInduction",
  wood: "cookingWood",
};

export default function OnboardingPage(): JSX.Element {
  const router = useRouter();
  const { t } = useT();

  // Lazy state initializers load existing profile if present without effect cascading
  const [city, setCity] = useState<CityName>(() => loadProfile()?.city ?? "Delhi");
  const [kids, setKids] = useState<number>(() => loadProfile()?.kids ?? 0);
  const [elderly, setElderly] = useState<number>(() => loadProfile()?.elderly ?? 0);
  const [asthma, setAsthma] = useState<boolean>(() => loadProfile()?.asthma ?? false);
  const [commuteMode, setCommuteMode] = useState<CommuteMode>(
    () => loadProfile()?.commuteMode ?? "metro"
  );
  const [commuteKm, setCommuteKm] = useState<number>(() => loadProfile()?.commuteKm ?? 10);
  const [windows, setWindows] = useState<WindowOption>(() => loadProfile()?.windows ?? "closed");
  const [purifier, setPurifier] = useState<boolean>(() => loadProfile()?.purifier ?? false);
  const [cooking, setCooking] = useState<CookingOption>(() => loadProfile()?.cooking ?? "lpg");

  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = {
      city,
      kids: Number(kids),
      elderly: Number(elderly),
      asthma,
      commuteMode,
      commuteKm: Number(commuteKm),
      windows,
      purifier,
      cooking,
    };

    const validation = UserProfileSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of validation.error.issues) {
        const fieldName = issue.path[0] as keyof FormErrors;
        if (fieldName === "city") fieldErrors.city = t("errorCityRequired");
        else if (fieldName === "kids") fieldErrors.kids = t("errorKidsInvalid");
        else if (fieldName === "elderly") fieldErrors.elderly = t("errorElderlyInvalid");
        else if (fieldName === "commuteKm") fieldErrors.commuteKm = t("errorCommuteKmInvalid");
        else if (fieldName === "commuteMode")
          fieldErrors.commuteMode = t("errorCommuteModeRequired");
        else if (fieldName === "windows") fieldErrors.windows = t("errorWindowsRequired");
        else if (fieldName === "cooking") fieldErrors.cooking = t("errorCookingRequired");
      }
      setErrors(fieldErrors);
      return;
    }

    const saved = saveProfile(validation.data);
    if (saved) {
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen flex-col w-full">
      {/* Skip to Content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-teal-900 focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
      >
        {t("skipToContent")}
      </a>

      {/* Full-width Website Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-linear-to-br from-teal-700 to-emerald-800 text-white shadow-md shadow-teal-950/20">
              <LeafIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                {t("appName")}
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-teal-800">{t("tagline")}</p>
            </div>
          </div>
          <nav aria-label="Language selection">
            <LanguageToggle />
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-3.5 py-5 sm:px-6 sm:py-8 lg:px-8"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8 lg:gap-10 items-start">
          {/* Left Column on Laptop & Desktop / Top Section on Mobile: Title & Calibration Station */}
          <div className="md:col-span-5 lg:col-span-4 md:sticky md:top-24 space-y-5">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50/90 px-3 py-0.5 text-xs font-bold text-teal-900 shadow-2xs">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-teal-700" />
                <span>Step 1 of 1 • Profile Calibration</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                {t("onboardingTitle")}
              </h2>
              <p className="mt-1.5 text-xs text-slate-600 sm:text-sm lg:text-base leading-relaxed">
                {t("onboardingSubtitle")}
              </p>
            </div>

            {/* Privacy Note */}
            <aside
              aria-label={t("privacyNote")}
              className="flex items-center gap-3.5 rounded-2xl border border-teal-200/80 bg-linear-to-r from-teal-50/90 to-emerald-50/80 p-4.5 text-xs font-semibold text-teal-950 shadow-xs"
            >
              <ShieldCheckIcon className="h-5 w-5 text-teal-700 shrink-0" />
              <p className="leading-relaxed">{t("privacyNote")}</p>
            </aside>

            {/* Laptop & Desktop Calibration Insights Card */}
            <div className="hidden md:block rounded-3xl border border-teal-900/10 bg-white/95 p-6 shadow-xl shadow-teal-950/5 backdrop-blur-md">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-950 flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-teal-700" />
                <span>Why Profile Calibration Matters</span>
              </h3>
              <ul className="mt-3.5 space-y-3 text-xs text-slate-700 font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-extrabold text-teal-950">
                    1
                  </span>
                  <span>
                    <strong className="text-slate-900 font-bold">City Live AQI:</strong> Connects
                    directly to official CPCB telemetry for selected location.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-extrabold text-teal-950">
                    2
                  </span>
                  <span>
                    <strong className="text-slate-900 font-bold">Family Vulnerability:</strong>{" "}
                    Calibrates dose multiplier for young lungs (&lt;12) and seniors.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-extrabold text-teal-950">
                    3
                  </span>
                  <span>
                    <strong className="text-slate-900 font-bold">Commute Exposure:</strong>{" "}
                    Calculates road smog ingestion based on your mode and km.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-extrabold text-teal-950">
                    4
                  </span>
                  <span>
                    <strong className="text-slate-900 font-bold">Indoor Protection:</strong> Models
                    purifier impact and cooking ventilation boundaries.
                  </span>
                </li>
              </ul>
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-extrabold text-teal-800">
                <span>🔒 100% On-Device Privacy</span>
                <span>⚡ Deterministic Math</span>
              </div>
            </div>
          </div>

          {/* Right Column: Form Fields */}
          <div className="md:col-span-7 lg:col-span-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Section 1: City */}
              <fieldset className="relative overflow-hidden rounded-3xl border border-teal-900/10 bg-white/95 p-6 shadow-xl shadow-teal-950/5 backdrop-blur-md">
                <legend className="px-2 text-base font-extrabold text-slate-950 sm:text-lg">
                  <span className="inline-flex items-center gap-2">
                    <MapPinIcon className="h-4.5 w-4.5 text-teal-700" />
                    <span>{t("legendLocation")}</span>
                  </span>
                </legend>
                <div className="mt-3">
                  <label
                    htmlFor="city"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    {t("cityLabel")}
                  </label>
                  <select
                    id="city"
                    name="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value as CityName)}
                    aria-invalid={!!errors.city}
                    aria-describedby={errors.city ? "city-error" : undefined}
                    className="mt-2 block min-h-11 w-full rounded-2xl border border-slate-200/90 bg-slate-50/60 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-inner focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-600/15"
                  >
                    {CITY_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <p
                      id="city-error"
                      role="alert"
                      className="mt-2 text-xs font-bold text-rose-600"
                    >
                      {errors.city}
                    </p>
                  )}
                </div>
              </fieldset>

              {/* Section 2: Family Members */}
              <fieldset className="relative overflow-hidden rounded-3xl border border-teal-900/10 bg-white/95 p-6 shadow-xl shadow-teal-950/5 backdrop-blur-md">
                <legend className="px-2 text-base font-extrabold text-slate-950 sm:text-lg">
                  <span className="inline-flex items-center gap-2">
                    <UserEditIcon className="h-4.5 w-4.5 text-teal-700" />
                    <span>{t("legendFamily")}</span>
                  </span>
                </legend>

                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4">
                    <label
                      htmlFor="kids"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      {t("kidsLabel")}
                    </label>
                    <input
                      id="kids"
                      name="kids"
                      type="number"
                      min="0"
                      max="20"
                      value={kids}
                      onChange={(e) => setKids(parseInt(e.target.value, 10) || 0)}
                      aria-invalid={!!errors.kids}
                      aria-describedby={errors.kids ? "kids-error" : undefined}
                      className="mt-2 block min-h-11 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-sm font-bold text-slate-900 shadow-inner focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/15"
                    />
                    {errors.kids && (
                      <p
                        id="kids-error"
                        role="alert"
                        className="mt-2 text-xs font-bold text-rose-600"
                      >
                        {errors.kids}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4">
                    <label
                      htmlFor="elderly"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      {t("elderlyLabel")}
                    </label>
                    <input
                      id="elderly"
                      name="elderly"
                      type="number"
                      min="0"
                      max="20"
                      value={elderly}
                      onChange={(e) => setElderly(parseInt(e.target.value, 10) || 0)}
                      aria-invalid={!!errors.elderly}
                      aria-describedby={errors.elderly ? "elderly-error" : undefined}
                      className="mt-2 block min-h-11 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-sm font-bold text-slate-900 shadow-inner focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/15"
                    />
                    {errors.elderly && (
                      <p
                        id="elderly-error"
                        role="alert"
                        className="mt-2 text-xs font-bold text-rose-600"
                      >
                        {errors.elderly}
                      </p>
                    )}
                  </div>
                </div>

                {/* Asthma Radio Group */}
                <fieldset className="mt-5 border-t border-slate-100/90 pt-4">
                  <legend className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t("asthmaLabel")}
                  </legend>
                  <div className="mt-2.5 flex flex-wrap gap-3">
                    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white px-5 py-2 text-xs font-bold text-slate-900 shadow-2xs transition-all hover:bg-slate-50 focus-within:ring-2 focus-within:ring-teal-600">
                      <input
                        type="radio"
                        name="asthma"
                        value="yes"
                        checked={asthma === true}
                        onChange={() => setAsthma(true)}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                      />
                      <span>{t("yes")}</span>
                    </label>

                    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white px-5 py-2 text-xs font-bold text-slate-900 shadow-2xs transition-all hover:bg-slate-50 focus-within:ring-2 focus-within:ring-teal-600">
                      <input
                        type="radio"
                        name="asthma"
                        value="no"
                        checked={asthma === false}
                        onChange={() => setAsthma(false)}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                      />
                      <span>{t("no")}</span>
                    </label>
                  </div>
                </fieldset>
              </fieldset>

              {/* Section 3: Daily Commute */}
              <fieldset className="relative overflow-hidden rounded-3xl border border-teal-900/10 bg-white/95 p-6 shadow-xl shadow-teal-950/5 backdrop-blur-md">
                <legend className="px-2 text-base font-extrabold text-slate-950 sm:text-lg">
                  <span className="inline-flex items-center gap-2">
                    <CarIcon className="h-4.5 w-4.5 text-teal-700" />
                    <span>{t("legendCommute")}</span>
                  </span>
                </legend>

                <fieldset className="mt-3">
                  <legend className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t("commuteModeLabel")}
                  </legend>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {COMMUTE_MODES.map((mode) => {
                      const Icon = COMMUTE_ICONS[mode];
                      return (
                        <label
                          key={mode}
                          className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition-all shadow-2xs focus-within:ring-2 focus-within:ring-teal-600 ${
                            commuteMode === mode
                              ? "border-teal-600 bg-linear-to-br from-teal-50 to-emerald-50/60 text-teal-950 ring-2 ring-teal-600/30"
                              : "border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="commuteMode"
                            value={mode}
                            checked={commuteMode === mode}
                            onChange={() => setCommuteMode(mode)}
                            className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                          />
                          <Icon className="h-4 w-4 shrink-0 text-teal-700" />
                          <span>{t(COMMUTE_MODE_LABEL_KEYS[mode])}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.commuteMode && (
                    <p role="alert" className="mt-2 text-xs font-bold text-rose-600">
                      {errors.commuteMode}
                    </p>
                  )}
                </fieldset>

                <div className="mt-5 border-t border-slate-100/90 pt-4">
                  <label
                    htmlFor="commuteKm"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    {t("commuteKmLabel")}
                  </label>
                  <input
                    id="commuteKm"
                    name="commuteKm"
                    type="number"
                    min="0"
                    max="200"
                    step="0.5"
                    value={commuteKm}
                    onChange={(e) => setCommuteKm(parseFloat(e.target.value) || 0)}
                    aria-invalid={!!errors.commuteKm}
                    aria-describedby={errors.commuteKm ? "commuteKm-error" : undefined}
                    className="mt-2 block min-h-11 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-sm font-bold text-slate-900 shadow-inner focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/15"
                  />
                  {errors.commuteKm && (
                    <p
                      id="commuteKm-error"
                      role="alert"
                      className="mt-2 text-xs font-bold text-rose-600"
                    >
                      {errors.commuteKm}
                    </p>
                  )}
                </div>
              </fieldset>

              {/* Section 4: Home & Cooking Habits */}
              <fieldset className="relative overflow-hidden rounded-3xl border border-teal-900/10 bg-white/95 p-6 shadow-xl shadow-teal-950/5 backdrop-blur-md">
                <legend className="px-2 text-base font-extrabold text-slate-950 sm:text-lg">
                  <span className="inline-flex items-center gap-2">
                    <HomeIcon className="h-4.5 w-4.5 text-teal-700" />
                    <span>{t("legendHome")}</span>
                  </span>
                </legend>

                {/* Windows */}
                <fieldset className="mt-3">
                  <legend className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t("windowsLabel")}
                  </legend>
                  <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {WINDOW_OPTIONS.map((opt) => (
                      <label
                        key={opt}
                        className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all shadow-2xs focus-within:ring-2 focus-within:ring-teal-600 ${
                          windows === opt
                            ? "border-teal-600 bg-linear-to-br from-teal-50 to-emerald-50/60 text-teal-950 ring-2 ring-teal-600/30"
                            : "border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="windows"
                          value={opt}
                          checked={windows === opt}
                          onChange={() => setWindows(opt)}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                        />
                        <span>{opt === "open" ? t("windowsOpen") : t("windowsClosed")}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Air Purifier */}
                <fieldset className="mt-5 border-t border-slate-100/90 pt-4">
                  <legend className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t("purifierLabel")}
                  </legend>
                  <div className="mt-2.5 flex flex-wrap gap-3">
                    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white px-5 py-2 text-xs font-bold text-slate-900 shadow-2xs transition-all hover:bg-slate-50 focus-within:ring-2 focus-within:ring-teal-600">
                      <input
                        type="radio"
                        name="purifier"
                        value="yes"
                        checked={purifier === true}
                        onChange={() => setPurifier(true)}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                      />
                      <span>{t("yes")}</span>
                    </label>

                    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white px-5 py-2 text-xs font-bold text-slate-900 shadow-2xs transition-all hover:bg-slate-50 focus-within:ring-2 focus-within:ring-teal-600">
                      <input
                        type="radio"
                        name="purifier"
                        value="no"
                        checked={purifier === false}
                        onChange={() => setPurifier(false)}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                      />
                      <span>{t("no")}</span>
                    </label>
                  </div>
                </fieldset>

                {/* Cooking Fuel */}
                <fieldset className="mt-5 border-t border-slate-100/90 pt-4">
                  <legend className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t("cookingLabel")}
                  </legend>
                  <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {COOKING_OPTIONS.map((opt) => (
                      <label
                        key={opt}
                        className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition-all shadow-2xs focus-within:ring-2 focus-within:ring-teal-600 ${
                          cooking === opt
                            ? "border-teal-600 bg-linear-to-br from-teal-50 to-emerald-50/60 text-teal-950 ring-2 ring-teal-600/30"
                            : "border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="cooking"
                          value={opt}
                          checked={cooking === opt}
                          onChange={() => setCooking(opt)}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                        />
                        <span>{t(COOKING_LABEL_KEYS[opt])}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </fieldset>

              {/* Submit */}
              <button
                type="submit"
                className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-teal-800 via-teal-900 to-slate-950 px-6 py-3.5 text-base font-extrabold text-white shadow-xl shadow-teal-950/20 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:from-teal-900 hover:to-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                <SparklesIcon className="h-5 w-5 shrink-0" />
                <span>{t("submitButton")}</span>
                <ArrowRightIcon className="h-5 w-5 shrink-0" />
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="mt-12 w-full border-t border-slate-200/80 bg-white/70 py-6">
        <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 text-xs text-slate-600">
          {t("footerDisclaimer")}
        </div>
      </footer>
    </div>
  );
}
