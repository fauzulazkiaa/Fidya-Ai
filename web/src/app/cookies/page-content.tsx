"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { PageShell } from "@/components/marketing/page-shell";
import { Card } from "@/components/ui/card";
import { getCopy } from "@/lib/seo-copy";

type Row = { name: string; purpose: string; duration: string };

function CookieTable({
  label,
  rows,
}: {
  label: string;
  rows: readonly Row[];
}) {
  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <Card key={row.name} className="grid gap-1.5 p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-start sm:gap-4">
            <dt className="text-xs font-semibold">{row.name}</dt>
            <dd className="text-xs leading-relaxed text-muted">{row.purpose}</dd>
            <dd className="text-[11px] text-muted sm:text-right">{row.duration}</dd>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function CookiesContent() {
  const { locale } = useLocale();
  const c = getCopy("cookies", locale);

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <section id="what" className="scroll-mt-24 space-y-3">
        <h2 className="text-lg font-bold">{c.whatTitle}</h2>
        <p className="text-sm leading-relaxed text-muted">{c.whatBody}</p>
      </section>

      <section id="categories" className="scroll-mt-24 space-y-5">
        <h2 className="text-lg font-bold">{c.categoriesTitle}</h2>
        <dl className="sr-only">
          <dt>{c.tableHeadName}</dt>
          <dd>{c.tableHeadPurpose}</dd>
          <dd>{c.tableHeadDuration}</dd>
        </dl>
        <CookieTable label={c.necessaryLabel} rows={c.rowsNecessary} />
        <CookieTable label={c.analyticsLabel} rows={c.rowsAnalytics} />
        <CookieTable label={c.preferencesLabel} rows={c.rowsPreferences} />
      </section>

      <section id="retention" className="scroll-mt-24 space-y-3">
        <h2 className="text-lg font-bold">{c.retentionTitle}</h2>
        <p className="text-sm leading-relaxed text-muted">{c.retentionBody}</p>
      </section>

      <section id="no-ads" className="scroll-mt-24 space-y-3">
        <h2 className="text-lg font-bold">{c.noAdsTitle}</h2>
        <p className="text-sm leading-relaxed text-muted">{c.noAdsBody}</p>
      </section>

      <section id="manage" className="scroll-mt-24 space-y-3">
        <h2 className="text-lg font-bold">{c.manageTitle}</h2>
        <p className="text-sm leading-relaxed text-muted">{c.manageBody1}</p>
        <p className="text-sm leading-relaxed text-muted">{c.manageBody2}</p>
      </section>

      <section id="contact" className="scroll-mt-24 space-y-3">
        <h2 className="text-lg font-bold">{c.contactTitle}</h2>
        <p className="text-sm leading-relaxed text-muted">{c.contactBody}</p>
      </section>

      <p className="text-[11px] text-muted">{c.updated}</p>
    </PageShell>
  );
}
