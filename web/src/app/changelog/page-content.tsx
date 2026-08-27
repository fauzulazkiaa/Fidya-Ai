"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/marketing/page-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

export default function ChangelogPageContent() {
  const { locale } = useLocale();
  const c = getCopy("changelog", locale);

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <ol className="relative space-y-8 border-l border-card-border pl-6">
        {c.releases.map((r) => (
          <li key={r.version} className="relative">
            <span
              className={
                r.tag
                  ? "absolute -left-[31px] top-1 size-2.5 rounded-full bg-accent ring-4 ring-accent/15"
                  : "absolute -left-[31px] top-1 size-2.5 rounded-full bg-tick-empty"
              }
            />
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold">v{r.version}</h2>
              <span className="text-[11px] text-muted">{r.date}</span>
              {r.tag && <Badge tone="accent">{r.tag}</Badge>}
            </div>
            <Card className="mt-3 p-5">
              <ul className="space-y-2">
                {r.items.map((item) => (
                  <li key={item} className="flex gap-2 text-xs leading-relaxed">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
