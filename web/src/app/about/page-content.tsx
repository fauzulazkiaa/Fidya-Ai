"use client";

import { Compass, HeartHandshake, ShieldCheck, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/marketing/page-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

const VALUE_ICONS = [Target, ShieldCheck, HeartHandshake] as const;

export default function AboutPageContent() {
  const { locale } = useLocale();
  const c = getCopy("about", locale);

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <section className="grid gap-4 sm:grid-cols-3">
        {c.stats.map((s) => (
          <Card key={s.stat} className="p-5 text-center">
            <p className="text-2xl font-extrabold tabular-nums text-accent">
              {s.stat}
            </p>
            <p className="mt-1 text-[11px] text-muted">{s.label}</p>
          </Card>
        ))}
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-muted">
        <h2 className="text-lg font-bold text-foreground">{c.buildingTitle}</h2>
        <p>{c.buildingBody1}</p>
        <p>{c.buildingBody2}</p>
      </section>

      <section>
        <h2 className="text-lg font-bold">{c.believeTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {c.values.map((v, i) => {
            const Icon = VALUE_ICONS[i];
            return (
              <Card key={v.title} className="p-5">
                <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Icon className="size-4" />
                </span>
                <h3 className="mt-3 text-sm font-bold">{v.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {v.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Compass className="mt-0.5 size-5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-semibold">{c.ctaTitle}</p>
            <p className="text-xs text-muted">{c.ctaDesc}</p>
          </div>
        </div>
        <a
          href="/careers"
          className="rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-110"
        >
          {c.ctaButton}
        </a>
      </Card>
    </PageShell>
  );
}
