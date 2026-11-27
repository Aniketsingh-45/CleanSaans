import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearProfile,
  DEFAULT_PROFILE,
  loadProfile,
  PROFILE_STORAGE_KEY,
  saveProfile,
  UserProfileSchema,
  type UserProfile,
} from "./profile";

const sampleProfile: UserProfile = {
  city: "Gurugram",
  kids: 2,
  elderly: 1,
  asthma: true,
  commuteMode: "car",
  commuteKm: 15,
  windows: "open",
  purifier: true,
  cooking: "induction",
};

describe("UserProfile & Storage Helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("validates a fully compliant UserProfile", () => {
    const result = UserProfileSchema.safeParse(sampleProfile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.city).toBe("Gurugram");
      expect(result.data.kids).toBe(2);
      expect(result.data.asthma).toBe(true);
    }
  });

  it("validates the default profile", () => {
    const result = UserProfileSchema.safeParse(DEFAULT_PROFILE);
    expect(result.success).toBe(true);
  });

  it("rejects non-whitelisted cities", () => {
    const invalid = { ...sampleProfile, city: "Bengaluru" };
    const result = UserProfileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects negative kid counts and negative distance", () => {
    const invalidKids = { ...sampleProfile, kids: -1 };
    expect(UserProfileSchema.safeParse(invalidKids).success).toBe(false);

    const invalidKm = { ...sampleProfile, commuteKm: -5 };
    expect(UserProfileSchema.safeParse(invalidKm).success).toBe(false);
  });

  it("rejects invalid commute modes or cooking options", () => {
    const invalidMode = { ...sampleProfile, commuteMode: "plane" };
    expect(UserProfileSchema.safeParse(invalidMode).success).toBe(false);

    const invalidCooking = { ...sampleProfile, cooking: "coal" };
    expect(UserProfileSchema.safeParse(invalidCooking).success).toBe(false);
  });

  it("saves validated profile to localStorage and loads it back", () => {
    expect(loadProfile()).toBeNull();

    const saved = saveProfile(sampleProfile);
    expect(saved).toBe(true);
    expect(localStorage.getItem(PROFILE_STORAGE_KEY)).toBeTruthy();

    const loaded = loadProfile();
    expect(loaded).toEqual(sampleProfile);
  });

  it("returns null when localStorage contains corrupted or invalid schema data", () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, "{ not a valid json");
    expect(loadProfile()).toBeNull();

    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ ...sampleProfile, city: "UnknownCity" })
    );
    expect(loadProfile()).toBeNull();
  });

  it("clearProfile removes stored data from localStorage", () => {
    saveProfile(sampleProfile);
    expect(loadProfile()).not.toBeNull();

    clearProfile();
    expect(loadProfile()).toBeNull();
  });
});
