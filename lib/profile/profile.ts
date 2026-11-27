import { useSyncExternalStore } from "react";
import { z } from "zod";
import { CityQuerySchema, type CityName } from "@/lib/data/cities";

export const COMMUTE_MODES = ["walk", "cycle", "bike", "bus", "metro", "car"] as const;
export type CommuteMode = (typeof COMMUTE_MODES)[number];

export const WINDOW_OPTIONS = ["open", "closed"] as const;
export type WindowOption = (typeof WINDOW_OPTIONS)[number];

export const COOKING_OPTIONS = ["lpg", "induction", "wood"] as const;
export type CookingOption = (typeof COOKING_OPTIONS)[number];

/**
 * Zod schema defining a family's smog exposure profile.
 */
export const UserProfileSchema = z.object({
  city: CityQuerySchema,
  kids: z.number().int().min(0).max(20),
  elderly: z.number().int().min(0).max(20),
  asthma: z.boolean(),
  commuteMode: z.enum(COMMUTE_MODES),
  commuteKm: z.number().finite().min(0).max(200),
  windows: z.enum(WINDOW_OPTIONS),
  purifier: z.boolean(),
  cooking: z.enum(COOKING_OPTIONS),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const PROFILE_STORAGE_KEY = "cleansaans_profile";

export const DEFAULT_PROFILE: UserProfile = {
  city: "Delhi",
  kids: 0,
  elderly: 0,
  asthma: false,
  commuteMode: "metro",
  commuteKm: 10,
  windows: "closed",
  purifier: false,
  cooking: "lpg",
};

/**
 * SSR-safe helper to load the stored profile from localStorage.
 * Returns null if not in browser, not found, or invalid schema.
 */
export function loadProfile(): UserProfile | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const result = UserProfileSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * SSR-safe helper to save the validated profile into localStorage.
 * Triggers a custom window event for reactive updates across components.
 */
export function saveProfile(profile: UserProfile): boolean {
  if (typeof localStorage === "undefined") {
    return false;
  }
  try {
    const validated = UserProfileSchema.parse(profile);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(validated));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cleansaans_profile_change"));
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * SSR-safe helper to remove stored profile from localStorage.
 */
export function clearProfile(): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cleansaans_profile_change"));
    }
  } catch {
    // LocalStorage restricted
  }
}

function subscribeProfile(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("cleansaans_profile_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("cleansaans_profile_change", callback);
  };
}

let cachedRaw: string | null = null;
let cachedProfile: UserProfile | null = null;

function getProfileSnapshot(): UserProfile | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw === cachedRaw) return cachedProfile;
    cachedRaw = raw;
    cachedProfile = loadProfile();
    return cachedProfile;
  } catch {
    return null;
  }
}

function getServerProfileSnapshot(): UserProfile | null {
  return null;
}

/**
 * React hook to reactively subscribe to the active UserProfile.
 * SSR-safe and hydration-safe via useSyncExternalStore.
 */
export function useProfile(): UserProfile | null {
  return useSyncExternalStore(subscribeProfile, getProfileSnapshot, getServerProfileSnapshot);
}

export type { CityName };
