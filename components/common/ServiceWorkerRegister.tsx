"use client";

import { useEffect } from "react";

/**
 * Client component that registers the minimal CleanSaans service worker
 * to enable PWA offline app shell capabilities.
 */
export function ServiceWorkerRegister(): null {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failed silently - PWA will continue as standard web app
      });
    }
  }, []);

  return null;
}
