"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  Quote,
  RefreshCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/marketing/page-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy, type CopyTree } from "@/lib/seo-copy";

const FEATURE_ICONS = [CalendarClock, BookOpenCheck, Quote, RefreshCcw];

export function StudentsContent() {
  const { locale } = useLocale();
  const c = getCopy("solutions_students", locale);
  const features = c.features.map((f: CopyTree, i: number): CopyTree => ({
    ...f,
    icon: FEATURE_ICONS[i],
  }));

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <section>
        <h2 className="text-lg font-bold">{c.featuresTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title} className="p-5">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                <f.icon className="size-4" />
              </span>
              <h3 className="mt-3 text-sm font-bold">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {f.desc}
              </p>
            </Card>
          ))}
        </div>
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

      <Card className="p-6">
        <Quote className="size-5 text-accent" />
        <p className="mt-3 text-sm leading-relaxed">&ldquo;{c.quote}&rdquo;</p>
        <p className="mt-3 text-xs font-semibold text-muted">{c.quoteAuthor}</p>
      </Card>

      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">{c.ctaTitle}</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">
            {c.ctaDesc}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Link
            href="/subscribe"
            className="flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-110"
          >
            {c.ctaButton} <ArrowRight className="size-3.5" />
          </Link>
          <Link
            href="/customers"
            className="rounded-full border border-card-border px-5 py-2.5 text-xs font-semibold transition-all hover:border-accent hover:text-accent"
          >
            {c.secondaryLink}
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}
