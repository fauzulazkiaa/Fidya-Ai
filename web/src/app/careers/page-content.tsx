"use client";

import { MapPin, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/marketing/page-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

export default function CareersPageContent() {
  const { locale } = useLocale();
  const c = getCopy("careers", locale);

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <section className="space-y-3">
        {c.roles.map((r) => (
          <Card key={r.title} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Briefcase className="size-4 text-accent" />
                  <h2 className="text-sm font-bold">{r.title}</h2>
                </div>
                <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-muted">
                  {r.desc}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                  <Badge tone="accent">{r.team}</Badge>
                  <span>{r.type}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" /> {r.location}
                  </span>
                </div>
              </div>
              <a
                href={`mailto:careers@fidya.ai?subject=${encodeURIComponent(
                  `${c.applicationSubject}: ${r.title}`
                )}`}
                className="shrink-0 rounded-full border border-card-border px-4 py-2 text-xs font-semibold transition-colors hover:border-accent/40 hover:text-accent"
              >
                {c.apply}
              </a>
            </div>
          </Card>
        ))}
      </section>

      <Card className="p-6 text-sm leading-relaxed text-muted">
        <h2 className="text-sm font-bold text-foreground">{c.noRoleTitle}</h2>
        <p className="mt-2">
          {c.noRoleBody1}{" "}
          <a
            href="mailto:careers@fidya.ai"
            className="text-accent underline underline-offset-2"
          >
            careers@fidya.ai
          </a>
          .
        </p>
      </Card>
    </PageShell>
  );
}
