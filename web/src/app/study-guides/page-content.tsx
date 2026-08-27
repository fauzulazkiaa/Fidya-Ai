"use client";

import Link from "next/link";
import {
  CalendarRange,
  BookMarked,
  Repeat2,
  GraduationCap,
  Mic,
  Rocket,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/marketing/page-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy, type CopyTree } from "@/lib/seo-copy";

const GUIDE_ICONS = [CalendarRange, BookMarked, Repeat2, GraduationCap, Mic, Rocket];

export function StudyGuidesContent() {
  const { locale } = useLocale();
  const c = getCopy("study_guides", locale);
  const guides = c.guides.map((g: CopyTree, i: number): CopyTree => ({
    ...g,
    icon: GUIDE_ICONS[i],
  }));

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <section className="grid gap-4 sm:grid-cols-2">
        {guides.map((guide) => (
          <Card key={guide.title} className="flex flex-col p-5">
            <div className="flex items-start justify-between">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                <guide.icon className="size-4" />
              </span>
              <span className="rounded-full border border-card-border px-2.5 py-0.5 text-[10px] font-semibold text-muted">
                {guide.format}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-bold leading-snug">{guide.title}</h3>
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
              <Lock className="size-3" />
              {guide.pages} {c.pages}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{guide.desc}</p>
            <div className="mt-auto pt-4">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-110"
              >
                {c.requestAccess}
              </Link>
            </div>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}
