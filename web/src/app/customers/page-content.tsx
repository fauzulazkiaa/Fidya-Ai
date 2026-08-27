"use client";

import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/marketing/page-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

export function CustomersContent() {
  const { locale } = useLocale();
  const c = getCopy("customers", locale);

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <section className="grid gap-4 sm:grid-cols-2">
        {c.stories.map((s) => (
          <Card key={s.name} className="flex flex-col p-5">
            <Quote className="size-4 text-accent" />
            <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">
              &ldquo;{s.quote}&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-3 border-t border-card-border pt-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
                {s.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{s.name}</p>
                <p className="truncate text-[11px] text-muted">{s.role}</p>
              </div>
            </div>
            <p className="mt-3 rounded-full bg-accent-soft px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-accent">
              {c.outcomeLabel}: {s.outcome}
            </p>
          </Card>
        ))}
      </section>

      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">{c.ctaTitle}</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">
            {c.ctaDesc}
          </p>
        </div>
        <Link
          href="/subscribe"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-110"
        >
          {c.ctaButton} <ArrowRight className="size-3.5" />
        </Link>
      </Card>
    </PageShell>
  );
}
