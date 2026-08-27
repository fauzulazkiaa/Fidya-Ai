"use client";

import { PageShell } from "@/components/marketing/page-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

export default function PrivacyPageContent() {
  const { locale } = useLocale();
  const c = getCopy("privacy", locale);
  const sections = c.sections;

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      {sections.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-24 space-y-3">
          <h2 className="text-lg font-bold">{s.title}</h2>
          <ul className="space-y-2.5">
            {s.body.map((p) => (
              <li key={p} className="flex gap-2 text-sm leading-relaxed text-muted">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
                {p}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-[11px] text-muted">{c.lastUpdated}</p>
    </PageShell>
  );
}
