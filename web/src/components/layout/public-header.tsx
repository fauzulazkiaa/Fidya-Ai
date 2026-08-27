"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";
import { StartCta } from "@/components/landing/start-cta";

/**
 * Marketing chrome for public pages (/about, /blog, /security, …).
 * The authenticated app navbar must never appear on these routes —
 * visitors clicking a footer link should stay in the marketing site.
 */
export function PublicHeader() {
  const { locale } = useLocale();
  const c = getCopy("header", locale);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-card-border bg-card/90 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold tracking-tight"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-accent text-[11px] font-extrabold text-white">
            F
          </span>
          Fidya
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/subscribe"
            className="hidden h-9 items-center rounded-full px-3.5 text-xs font-medium text-muted hover:bg-tick-empty/40 hover:text-foreground sm:flex"
          >
            {c.pricing}
          </Link>
          <Link
            href="/blog"
            className="hidden h-9 items-center rounded-full px-3.5 text-xs font-medium text-muted hover:bg-tick-empty/40 hover:text-foreground sm:flex"
          >
            {c.blog}
          </Link>
          <Link
            href="/sign-in"
            className="flex h-9 items-center rounded-full px-3.5 text-xs font-medium text-muted hover:bg-tick-empty/40 hover:text-foreground"
          >
            {c.logIn}
          </Link>
          <StartCta className="ml-1 flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(79,70,229,0.35)] transition-brightness hover:brightness-110">
            {c.getStarted} <ArrowRight className="size-3.5" />
          </StartCta>
        </div>
      </nav>
    </header>
  );
}
