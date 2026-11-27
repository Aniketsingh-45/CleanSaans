"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type JSX } from "react";
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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6 sm:px-6">
      {/* Skip to Content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-teal-900 focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
      >
        {t("skipToContent")}
      </a>

      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">{t("appName")}</h1>
          <p className="text-sm font-medium text-teal-800">{t("tagline")}</p>
        </div>
        <nav aria-label="Language selection">
          <LanguageToggle />
        </nav>
      </header>

      <main id="main-content" className="flex-1 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">{t("onboardingTitle")}</h2>
          <p className="mt-1 text-sm text-slate-600">{t("onboardingSubtitle")}</p>
        </div>

        {/* Privacy Note */}
        <aside
          aria-label={t("privacyNote")}
          className="mb-6 flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-xs font-medium text-teal-950"
        >
          <span aria-hidden="true" className="text-lg">
            🔒
          </span>
          <p>{t("privacyNote")}</p>
        </aside>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Section 1: City */}
          <fieldset className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <legend className="px-1 text-base font-semibold text-slate-950">
              {t("legendLocation")}
            </legend>
            <div className="mt-3">
              <label htmlFor="city" className="block text-sm font-medium text-slate-700">
                {t("cityLabel")}
              </label>
              <select
                id="city"
                name="city"
                value={city}
                onChange={(e) => setCity(e.target.value as CityName)}
                aria-invalid={!!errors.city}
                aria-describedby={errors.city ? "city-error" : undefined}
                className="mt-1.5 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
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
                  className="mt-1.5 text-xs font-medium text-rose-600"
                >
                  {errors.city}
                </p>
              )}
            </div>
          </fieldset>

          {/* Section 2: Family Members */}
          <fieldset className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <legend className="px-1 text-base font-semibold text-slate-950">
              {t("legendFamily")}
            </legend>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="kids" className="block text-sm font-medium text-slate-700">
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
                  className="mt-1.5 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                />
                {errors.kids && (
                  <p
                    id="kids-error"
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-rose-600"
                  >
                    {errors.kids}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="elderly" className="block text-sm font-medium text-slate-700">
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
                  className="mt-1.5 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                />
                {errors.elderly && (
                  <p
                    id="elderly-error"
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-rose-600"
                  >
                    {errors.elderly}
                  </p>
                )}
              </div>
            </div>

            {/* Asthma Radio Group */}
            <fieldset className="mt-4 border-t border-slate-100 pt-3">
              <legend className="text-sm font-medium text-slate-700">{t("asthmaLabel")}</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-teal-600">
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

                <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-teal-600">
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
          <fieldset className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <legend className="px-1 text-base font-semibold text-slate-950">
              {t("legendCommute")}
            </legend>

            <fieldset className="mt-3">
              <legend className="text-sm font-medium text-slate-700">
                {t("commuteModeLabel")}
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {COMMUTE_MODES.map((mode) => (
                  <label
                    key={mode}
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-within:ring-2 focus-within:ring-teal-600 ${
                      commuteMode === mode
                        ? "border-teal-600 bg-teal-50/70 text-teal-950"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
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
                    <span>{t(COMMUTE_MODE_LABEL_KEYS[mode])}</span>
                  </label>
                ))}
              </div>
              {errors.commuteMode && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.commuteMode}
                </p>
              )}
            </fieldset>

            <div className="mt-4 border-t border-slate-100 pt-3">
              <label htmlFor="commuteKm" className="block text-sm font-medium text-slate-700">
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
                className="mt-1.5 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              />
              {errors.commuteKm && (
                <p
                  id="commuteKm-error"
                  role="alert"
                  className="mt-1.5 text-xs font-medium text-rose-600"
                >
                  {errors.commuteKm}
                </p>
              )}
            </div>
          </fieldset>

          {/* Section 4: Home & Cooking Habits */}
          <fieldset className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <legend className="px-1 text-base font-semibold text-slate-950">
              {t("legendHome")}
            </legend>

            {/* Windows */}
            <fieldset className="mt-3">
              <legend className="text-sm font-medium text-slate-700">{t("windowsLabel")}</legend>
              <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {WINDOW_OPTIONS.map((opt) => (
                  <label
                    key={opt}
                    className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors focus-within:ring-2 focus-within:ring-teal-600 ${
                      windows === opt
                        ? "border-teal-600 bg-teal-50/70 text-teal-950"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
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
            <fieldset className="mt-4 border-t border-slate-100 pt-3">
              <legend className="text-sm font-medium text-slate-700">{t("purifierLabel")}</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-teal-600">
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

                <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-teal-600">
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
            <fieldset className="mt-4 border-t border-slate-100 pt-3">
              <legend className="text-sm font-medium text-slate-700">{t("cookingLabel")}</legend>
              <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {COOKING_OPTIONS.map((opt) => (
                  <label
                    key={opt}
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-within:ring-2 focus-within:ring-teal-600 ${
                      cooking === opt
                        ? "border-teal-600 bg-teal-50/70 text-teal-950"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
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
            className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-teal-700 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            {t("submitButton")}
          </button>
        </form>
      </main>

      <footer className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-600">
        {t("footerDisclaimer")}
      </footer>
    </div>
  );
}
