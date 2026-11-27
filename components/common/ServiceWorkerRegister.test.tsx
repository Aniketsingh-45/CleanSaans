import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";

describe("ServiceWorkerRegister", () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it("registers /sw.js when serviceWorker is supported in navigator", () => {
    const mockRegister = vi.fn().mockResolvedValue({ scope: "/" });

    Object.defineProperty(globalThis, "navigator", {
      value: {
        ...originalNavigator,
        serviceWorker: {
          register: mockRegister,
        },
      },
      writable: true,
      configurable: true,
    });

    render(<ServiceWorkerRegister />);
    expect(mockRegister).toHaveBeenCalledWith("/sw.js");
  });

  it("catches registration failure gracefully without throwing", () => {
    const mockRegister = vi.fn().mockRejectedValue(new Error("Registration failed"));

    Object.defineProperty(globalThis, "navigator", {
      value: {
        ...originalNavigator,
        serviceWorker: {
          register: mockRegister,
        },
      },
      writable: true,
      configurable: true,
    });

    expect(() => render(<ServiceWorkerRegister />)).not.toThrow();
    expect(mockRegister).toHaveBeenCalledWith("/sw.js");
  });

  it("does nothing when serviceWorker is not supported in navigator", () => {
    const mockNav = { ...originalNavigator };
    delete (mockNav as Record<string, unknown>).serviceWorker;

    Object.defineProperty(globalThis, "navigator", {
      value: mockNav,
      writable: true,
      configurable: true,
    });

    expect(() => render(<ServiceWorkerRegister />)).not.toThrow();
  });
});
