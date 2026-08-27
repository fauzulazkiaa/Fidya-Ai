"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  FileSearch,
  GraduationCap,
  Network,
  Quote,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/marketing/page-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy, type CopyTree } from "@/lib/seo-copy";

const BENEFIT_ICONS = [FileSearch, BookOpenCheck, ShieldCheck, Network];

export function ResearchersContent() {
  const { locale } = useLocale();
  const c = getCopy("solutions_researchers", locale);
  const benefits = c.benefits.map((b: CopyTree, i: number): CopyTree => ({
    ...b,
    icon: BENEFIT_ICONS[i],
  }));

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <section>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <GraduationCap className="size-5 text-accent" /> {c.benefitsTitle}
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
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="size-4 shrink-0 text-accent" />
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted">{c.note}</p>
        </Card>
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
            href="/study-guides"
            className="flex items-center gap-1.5 rounded-full border border-card-border px-5 py-2.5 text-xs font-semibold transition-colors hover:bg-accent-soft"
          >
            <Workflow className="size-3.5" /> {c.secondaryCta}
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}
