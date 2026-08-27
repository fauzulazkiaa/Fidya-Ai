"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Code2,
  GraduationCap,
  Microscope,
  Repeat,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/marketing/page-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy, type CopyTree } from "@/lib/seo-copy";

const PERSONA_ICONS = [GraduationCap, Code2, Repeat, Microscope, Users, Building2];

export function SolutionsContent() {
  const { locale } = useLocale();
  const c = getCopy("solutions", locale);
  const personas = c.personas.map((p: CopyTree, i: number): CopyTree => ({
    ...p,
    icon: PERSONA_ICONS[i],
  }));

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <section>
        <h2 className="text-lg font-bold">{c.personasTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {personas.map((p) => (
            <Link key={p.name} href={p.href} className="group">
              <Card className="h-full p-5 transition-all group-hover:border-accent">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <p.icon className="size-4" />
                  </span>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h3 className="mt-3 text-sm font-bold">{p.name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {p.desc}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Card className="flex flex-col items-start gap-4 bg-accent p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">{c.ctaTitle}</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed opacity-90">
            {c.ctaDesc}
          </p>
        </div>
        <Link
          href="/subscribe"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-accent transition-all hover:brightness-95"
        >
          {c.ctaButton} <ArrowRight className="size-3.5" />
        </Link>
      </Card>
    </PageShell>
  );
}
