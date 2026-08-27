"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Handshake,
  KeyRound,
  LineChart,
  Quote,
  ShieldAlert,
  Tag,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/marketing/page-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy, type CopyTree } from "@/lib/seo-copy";

const BENEFIT_ICONS = [CalendarDays, LineChart, ShieldAlert, Handshake];

export function BootcampsContent() {
  const { locale } = useLocale();
  const c = getCopy("solutions_bootcamps", locale);
  const benefits = c.benefits.map((b: CopyTree, i: number): CopyTree => ({
    ...b,
    icon: BENEFIT_ICONS[i],
  }));

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <section>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Building2 className="size-5 text-accent" /> {c.benefitsTitle}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {benefits.map((b) => (
            <Card key={b.title} className="p-5">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                <b.icon className="size-4" />
              </span>
              <h3 className="mt-3 text-sm font-bold">{b.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {b.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Card className="flex items-center gap-4 p-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Tag className="size-4" />
          </span>
          <p className="text-xs leading-relaxed text-muted">{c.pricingHint}</p>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-bold">{c.howTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {c.how.map((s) => (
            <Card key={s.step} className="p-5">
              <p className="text-[11px] font-bold tracking-widest text-accent">
                {s.step}
              </p>
              <h3 className="mt-2 text-sm font-bold">{s.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {s.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">{c.statsTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {c.stats.map((s) => (
            <Card key={s.stat} className="p-5 text-center">
              <p className="text-2xl font-extrabold tabular-nums text-accent">
                {s.stat}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                {s.label}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Card className="p-6">
          <Quote className="size-5 text-accent" />
          <blockquote className="mt-3 text-sm leading-relaxed text-foreground/90">
            &ldquo;{c.quote}&rdquo;
          </blockquote>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            {c.quoteAuthor}
          </p>
        </Card>
      </section>

      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <ClipboardCheck className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">{c.ctaTitle}</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">
              {c.ctaDesc}
            </p>
          </div>
        </div>
        <Link
          href="/contact"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-110"
        >
          {c.ctaButton} <ArrowRight className="size-3.5" />
        </Link>
      </Card>

      <Card className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <KeyRound className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">{c.secondaryCta}</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">
              {c.secondaryNote}
            </p>
          </div>
        </div>
        <Link
          href="/business"
          className="shrink-0 rounded-full border border-card-border px-5 py-2.5 text-xs font-semibold transition-colors hover:bg-accent-soft"
        >
          Fidya for Business
        </Link>
      </Card>
    </PageShell>
  );
}
