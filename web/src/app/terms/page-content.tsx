"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

export default function TermsPageContent() {
  const { locale } = useLocale();
  const c = getCopy("terms", locale);
  const sections = c.sections;

  return (
    <div className="mx-auto max-w-3xl px-6">
      <header className="pb-8 pt-4 text-center sm:pt-10">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          {c.eyebrow}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{c.title}</h1>
        <p className="mt-2 text-xs text-muted">{c.lastUpdated}</p>
      </header>

      {/* Quick nav */}
      <nav className="mb-8 flex flex-wrap justify-center gap-2">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-card-border bg-card px-3 py-1.5 text-[11px] font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent"
          >
            {s.title.replace(/^\d+\.\s/, "")}
          </a>
        ))}
      </nav>

      <article className="space-y-8 pb-16">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-28">
            <h2 className="text-lg font-bold tracking-tight">{s.title}</h2>
            {s.body.map((para, i) => (
              <p key={i} className="mt-3 text-sm leading-relaxed text-muted">
                {para}
              </p>
            ))}
          </section>
        ))}

        {/* Privacy summary */}
        <section id="privacy" className="scroll-mt-28 rounded-3xl border border-card-border bg-card p-6">
          <h2 className="text-lg font-bold tracking-tight">{c.privacySummaryTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            {c.privacySummary.map((li) => (
              <li key={li}>{li}</li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}
