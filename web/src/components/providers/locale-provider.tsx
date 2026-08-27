"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Locale = "en" | "id";

const STORAGE_KEY = "fidya.locale";
const EVENT = "fidya:locale-change";

function localeFromUrl(): Locale | null {
  try {
    const value = new URLSearchParams(window.location.search).get("lang");
    return value === "id" || value === "en" ? value : null;
  } catch {
    return null;
  }
}

function getSnapshot(): Locale {
  const fromUrl = localeFromUrl();
  if (fromUrl) return fromUrl;
  try {
    return localStorage.getItem(STORAGE_KEY) === "id" ? "id" : "en";
  } catch {
    return "en";
  }
}

function getServerSnapshot(): Locale {
  return "en";
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Client-side locale preference persisted to localStorage["fidya.locale"].
 * An explicit ?lang=en|id query param wins over the stored preference and is
 * written back to it, so shared links stay on their language while normal
 * navigation keeps the learner's choice. Renders with the default ("en")
 * during SSR, then switches after hydration if needed — no route-level
 * locales required.
 */
export function useLocale(): {
  locale: Locale;
  setLocale: (locale: Locale) => void;
} {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable
    }
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("lang")) {
        url.searchParams.set("lang", next);
        window.history.replaceState(null, "", url);
      }
    } catch {
      // history unavailable
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { locale, setLocale };
}
