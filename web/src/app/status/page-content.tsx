"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { PageShell } from "@/components/marketing/page-shell";
import { Card } from "@/components/ui/card";
import { getCopy } from "@/lib/seo-copy";

const COMPONENTS = [
  {
    key: "api",
    uptime: "99.99%",
  },
  {
    key: "web",
    uptime: "100%",
  },
  {
    key: "database",
    uptime: "99.98%",
  },
  {
    key: "auth",
    uptime: "99.97%",
  },
  {
    key: "ai",
    uptime: "99.92%",
  },
  {
    key: "email",
    uptime: "99.95%",
  },
] as const;

const DEGRADED_DAYS = new Set([34, 71]);

const DAYS = Array.from({ length: 90 }, (_, i) =>
  DEGRADED_DAYS.has(i) ? ("degraded" as const) : ("operational" as const)
);

export function StatusContent() {
  const { locale } = useLocale();
  const c = getCopy("status", locale);

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <Card className="flex flex-col items-start gap-3 border-citation-public/30 bg-citation-public/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-citation-public opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-citation-public" />
          </span>
          <p className="text-sm font-bold text-citation-public">
            {c.allOperational}
          </p>
        </div>
        <p className="text-[11px] text-muted">{c.lastUpdated}</p>
      </Card>

      <section>
        <h2 className="text-lg font-bold">{c.componentsTitle}</h2>
        <Card className="mt-4 divide-y divide-card-border overflow-hidden">
          {COMPONENTS.map(({ key, uptime }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 shrink-0 rounded-full bg-citation-public" />
                  <p className="text-sm font-semibold">
                    {c.components[key].name}
                  </p>
                </div>
                <p className="mt-1 pl-3.5 text-xs text-muted">
                  {c.components[key].desc}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden text-xs font-medium text-muted sm:inline">
                  {uptime}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-citation-public/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-citation-public">
                  <span className="size-1 rounded-full bg-citation-public" />
                  {c.operational}
                </span>
              </div>
            </div>
          ))}
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-bold">{c.uptimeTitle}</h2>
        <Card className="mt-4 p-5">
          <div className="flex items-end gap-[3px]">
            {DAYS.map((day, i) => (
              <span
                key={i}
                title={day === "operational" ? c.legend.operational : c.legend.degraded}
                className={
                  day === "operational"
                    ? "h-8 flex-1 rounded-sm bg-citation-public"
                    : "h-8 flex-1 rounded-sm bg-amber-400"
                }
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted">{c.uptimeCaption}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-citation-public" />
              {c.legend.operational}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-amber-400" />
              {c.legend.degraded}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-red-500" />
              {c.legend.incident}
            </span>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-bold">{c.incidentsTitle}</h2>
        <Card className="mt-4 p-6 text-center">
          <p className="text-sm text-muted">{c.noIncidents}</p>
        </Card>
      </section>
    </PageShell>
  );
}
