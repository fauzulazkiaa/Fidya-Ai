"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Globe, Loader2, Lock, PartyPopper, ShieldCheck } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";
import { useToast } from "@/components/ui/toast";

const SOCIALS: {
  label: string;
  href: string;
  path: string;
}[] = [
  {
    label: "GitHub",
    href: "https://github.com/fauzulazkiaa",
    path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/fauzulazkiaa/",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM16.79 5.814a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88zM12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/fauzul-azkia",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125M7.119 20.452H3.554V9h3.565zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z",
  },
];

const APPLE_PATH =
  "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702";

const PLAY_PATHS = [
  "M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594z",
  "M1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924z",
  "M13.544 10.989l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973z",
  "M13.544 13.056l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z",
];

const STORE_BADGES = [
  { label: "Download on the App Store", short: "App Store", icon: "apple" },
  { label: "Get it on Google Play", short: "Google Play", icon: "play" },
] as const;

/* href/external config per footer column; display copy lives in content JSON */
const COLUMN_LINKS: { href: string; external?: boolean }[][] = [
  [
    { href: "/#agents" },
    { href: "/#demo" },
    { href: "/subscribe" },
    { href: "/business" },
    { href: "/customers" },
    { href: "/changelog" },
    { href: "/roadmap" },
  ],
  [
    { href: "/solutions/students" },
    { href: "/solutions/self-taught-devs" },
    { href: "/solutions/career-switchers" },
    { href: "/solutions/researchers" },
    { href: "/solutions/bootcamps" },
    { href: "/business" },
  ],
  [
    { href: "/blog" },
    { href: "/study-guides" },
    { href: "/webinars" },
    { href: "/help" },
    { href: "/#faq-anchor" },
  ],
  [
    { href: "/api-docs" },
    { href: "/status" },
    { href: "/changelog" },
    { href: "/roadmap" },
  ],
  [
    { href: "https://github.com/fauzulazkiaa", external: true },
    { href: "https://www.instagram.com/fauzulazkiaa/", external: true },
    { href: "https://www.linkedin.com/in/fauzul-azkia", external: true },
    { href: "https://github.com/fauzulazkiaa", external: true },
  ],
  [
    { href: "/about" },
    { href: "/team" },
    { href: "/careers" },
    { href: "/contact" },
  ],
  [
    { href: "/terms" },
    { href: "/privacy" },
    { href: "/cookies" },
    { href: "/terms#sources" },
    { href: "/security" },
    { href: "/humans.txt", external: true },
    { href: "/lawyers.txt", external: true },
    { href: "/.well-known/security.txt", external: true },
  ],
];

export function SiteFooter() {
  const api = useApi();
  const { locale, setLocale } = useLocale();
  const c = getCopy("footer", locale);
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  function changeLocale(next: string) {
    if (next === "en" || next === "id") setLocale(next);
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || state === "loading") return;
    setState("loading");
    try {
      await api.subscribeNewsletter(email);
      setState("done");
      setEmail("");
      toast({
        tone: "success",
        title: c.toastSuccessTitle,
        desc: c.toastSuccessDesc,
      });
      setTimeout(() => setState("idle"), 6000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 5000);
    }
  }

  return (
    <footer className="border-t border-card-border bg-card/40">
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-14">
        {/* Top row: brand + newsletter + link columns */}
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          {/* Brand & newsletter */}
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2 text-sm font-bold tracking-tight">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent text-[11px] font-extrabold text-white">
                F
              </span>
              Fidya
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              {c.tagline}
            </p>

            <p className="mt-6 text-xs font-semibold">{c.newsletterTitle}</p>
            <p className="mt-1 text-[11px] text-muted">{c.newsletterDesc}</p>
            <form onSubmit={subscribe} className="mt-3 flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state !== "loading") setState("idle");
                }}
                placeholder="you@example.com"
                aria-label={c.emailLabel}
                className="h-10 w-full min-w-0 flex-1 rounded-full border border-card-border bg-background px-4 text-xs outline-none transition-colors placeholder:text-muted focus:border-accent"
              />
              <button
                type="submit"
                disabled={state === "loading"}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(79,70,229,0.3)] transition-all hover:brightness-110 disabled:opacity-80"
              >
                {state === "idle" && c.subscribe}
                {state === "loading" && (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> {c.sending}
                  </>
                )}
                {state === "done" && (
                  <>
                    <Check className="size-3.5" /> {c.subscribed}
                  </>
                )}
                {state === "error" && (
                  <>
                    <PartyPopper className="size-3.5" /> {c.tryAgain}
                  </>
                )}
              </button>
            </form>
            {state === "error" && (
              <p className="mt-2 text-[11px] text-orange-500">{c.error}</p>
            )}

            <p className="mt-6 text-xs font-semibold">{c.getTheApp}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {STORE_BADGES.map((b) => (
                <span
                  key={b.label}
                  role="img"
                  aria-label={`${b.label} — ${c.comingSoon}`}
                  title={`${b.label} — ${c.comingSoon}`}
                  className="relative flex h-8 cursor-not-allowed select-none items-center gap-1.5 rounded-full border border-dashed border-card-border bg-background px-3 text-[11px] font-medium text-muted opacity-55"
                >
                  {b.icon === "apple" ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                      <path d={APPLE_PATH} />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                      {PLAY_PATHS.map((d) => (
                        <path key={d} d={d} />
                      ))}
                    </svg>
                  )}
                  {b.short}
                </span>
              ))}
              <span
                title={c.comingSoon}
                className="flex h-5 items-center rounded-full bg-accent-soft px-1.5 text-[9px] font-bold uppercase tracking-wide text-accent"
              >
                {c.comingSoon}
              </span>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {c.columns.map((col, ci) => (
              <div key={col.title}>
                <p className="text-xs font-bold">{col.title}</p>
                <ul className="mt-3 space-y-2.5">
                  {col.links.map((label, li) => {
                    const l = COLUMN_LINKS[ci][li];
                    return (
                      <li key={label}>
                        <Link
                          href={l.href}
                          target={l.external ? "_blank" : undefined}
                          rel={l.external ? "noopener noreferrer" : undefined}
                          className="text-xs text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline"
                        >
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-12 flex flex-col items-start gap-3 border-t border-card-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs font-semibold">
            <ShieldCheck className="size-4 text-citation-public" />
            {c.trustLine}
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
            {c.trustBadges.map((b) => (
              <li key={b} className="flex items-center gap-1">
                <Lock className="size-3 text-citation-public" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-card-border pt-6 sm:flex-row">
          <p className="text-[11px] text-muted">
            © {new Date().getFullYear()} Fidya Labs, Inc.
            {c.copyrightSuffix}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/status"
              className="flex items-center gap-1.5 rounded-full border border-card-border px-3 py-1 text-[10px] font-medium text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-citation-public opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-citation-public" />
              </span>
              {c.systemsOk}
            </Link>

            <label className="flex items-center gap-1 rounded-full border border-card-border px-2 py-1 text-muted transition-colors hover:text-foreground">
              <Globe className="size-3" />
              <span className="sr-only">{c.language}</span>
              <select
                value={locale}
                onChange={(e) => changeLocale(e.target.value)}
                aria-label={c.language}
                className="cursor-pointer appearance-none bg-transparent pr-0.5 text-[10px] font-medium outline-none [&>option]:text-foreground"
              >
                <option value="en">EN</option>
                <option value="id">ID</option>
              </select>
            </label>

            {SOCIALS.length > 0 && (
              <div className="flex items-center gap-1">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-tick-empty/50 hover:text-foreground"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
                      <path d={s.path} />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
