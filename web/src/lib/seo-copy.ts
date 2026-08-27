import type { Metadata } from "next";
import seoCopy from "../../content/seo_copy.json";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Locale = "en" | "id";

/** Loose tree shape used for dynamic/internal access. */
export type CopyTree = Record<string, any>;

type PagesMap = typeof seoCopy.pages;

export type PageName = Extract<keyof PagesMap, string>;

function rawPages(): Record<string, Record<Locale, CopyTree>> {
  return seoCopy.pages as unknown as Record<string, Record<Locale, CopyTree>>;
}

/**
 * Returns the fully-typed copy tree for a page + locale, straight from
 * web/content/seo_copy.json. Falls back to English, then to an empty object.
 */
export function getCopy<Page extends PageName>(
  page: Page,
  locale: Locale,
): PagesMap[Page][Locale] {
  const entry = rawPages()[page];
  return (entry?.[locale] ?? entry?.en ?? {}) as PagesMap[Page][Locale];
}

const META_KEYS = [
  "alternates",
  "keywords",
  "openGraph",
  "robots",
  "twitter",
] as const;

/**
 * Builds a Next.js Metadata object from a page's `_meta` block (English).
 */
export function buildMetadata(page: string): Metadata {
  const meta: CopyTree = rawPages()[page]?.en?._meta ?? {};
  const out: Record<string, unknown> = {
    title: meta.title,
    description: meta.description,
  };
  for (const key of META_KEYS) {
    if (meta[key] !== undefined) out[key] = meta[key];
  }
  return out as Metadata;
}
