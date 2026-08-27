"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/marketing/page-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

const MEMBER_INITIALS = ["FA", "CW", "AH", "MG", "SP", "JO"] as const;

const FOUNDER_SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/fauzulazkiaa/",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  },
  {
    label: "GitHub",
    href: "https://github.com/fauzulazkiaa",
    path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/fauzul-azkia",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125M7.119 20.452H3.554V9h3.565zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z",
  },
] as const;

export function TeamContent() {
  const { locale } = useLocale();
  const c = getCopy("team", locale);

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <section>
        <h2 className="text-lg font-bold">{c.membersTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {c.members.map((m, i) => {
            const isFounder = i === 0;
            const initials = MEMBER_INITIALS[i];
            return (
              <Card
                key={m.name}
                className={
                  isFounder
                    ? "relative border-accent/30 p-5 text-center ring-1 ring-accent/20"
                    : "p-5 text-center"
                }
              >
                <span className="relative mx-auto flex size-12 items-center justify-center rounded-full bg-accent-soft text-sm font-extrabold tracking-wide text-accent">
                  {initials}
                  {isFounder && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-2 py-px text-[8px] font-bold uppercase tracking-wide text-white shadow">
                      {c.founderBadge}
                    </span>
                  )}
                </span>
                <h3 className="mt-3 text-sm font-bold">{m.name}</h3>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                  {m.role}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">{m.bio}</p>
                {isFounder && (
                  <div className="mt-3 flex items-center justify-center gap-1">
                    {FOUNDER_SOCIALS.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${m.name} — ${s.label}`}
                        className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-tick-empty/50 hover:text-accent"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                          <path d={s.path} />
                        </svg>
                      </a>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">{c.hiringTitle}</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">
              {c.hiringDesc}
            </p>
          </div>
        </div>
        <Link
          href="/careers"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-110"
        >
          {c.hiringButton} <ArrowRight className="size-3.5" />
        </Link>
      </Card>
    </PageShell>
  );
}
