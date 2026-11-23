"use client";

import { useEffect } from "react";

async function clearServiceWorkersAndCaches() {
  if (!("serviceWorker" in navigator)) return false;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  return registrations.length > 0;
}

export function RegisterServiceWorker() {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Dev (and recovery after bad SW caches): always wipe SWs so Turbopack chunks stay fresh.
      if (process.env.NODE_ENV !== "production") {
        const hadWorkers = await clearServiceWorkersAndCaches();
        if (!cancelled && hadWorkers && !sessionStorage.getItem("pmp.sw.cleared")) {
          sessionStorage.setItem("pmp.sw.cleared", "1");
          window.location.reload();
        }
        return;
      }

      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch {
        // PWA registration is progressive enhancement; the app remains usable without it.
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
