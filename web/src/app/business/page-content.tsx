"use client";

import Link from "next/link";
import {
  BarChart3,
  Building2,
  GraduationCap,
  Headset,
  KeyRound,
  Layers,
  Route,
  Tag,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/marketing/page-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

const BENEFIT_ICONS = [Route, BarChart3, KeyRound, Tag, Headset, Layers] as const;

export function BusinessContent() {
  const { locale } = useLocale();
  const c = getCopy("business", locale);

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <section>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Building2 className="size-5 text-accent" /> {c.benefitsTitle}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {c.benefits.map((b, i) => {
            const Icon = BENEFIT_ICONS[i];
            return (
            <Card key={b.title} className="p-5">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Icon className="size-4" />
              </span>
              <h3 className="mt-3 text-sm font-bold">{b.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {b.desc}
              </p>
            </Card>
            );
          })}
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

      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <GraduationCap className="size-4" />
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
          <Users className="size-3.5" /> {c.ctaButton}
        </Link>
      </Card>
    </PageShell>
  );
}
