"use client";

import Link from "next/link";
import {
  Activity,
  DatabaseBackup,
  EyeOff,
  KeyRound,
  Lock,
  Server,
  ShieldCheck,
} from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { PageShell } from "@/components/marketing/page-shell";
import { Card } from "@/components/ui/card";
import { getCopy } from "@/lib/seo-copy";

const SECTIONS = [
  {
    icon: Lock,
    key: "encryption",
  },
  {
    icon: Server,
    key: "infrastructure",
  },
  {
    icon: KeyRound,
    key: "authentication",
  },
  {
    icon: ShieldCheck,
    key: "aiSafety",
  },
  {
    icon: EyeOff,
    key: "access",
  },
  {
    icon: DatabaseBackup,
    key: "backups",
  },
] as const;

export function SecurityContent() {
  const { locale } = useLocale();
  const c = getCopy("security", locale);

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      {SECTIONS.map(({ icon: Icon, key }) => (
        <section key={key} id={key} className="scroll-mt-24">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Icon className="size-4" />
            </span>
            <h2 className="text-lg font-bold">{c.sections[key].title}</h2>
          </div>
          {c.sections[key].body.map((para, i) => (
            <p key={i} className="mt-3 text-sm leading-relaxed text-muted">
              {para}
            </p>
          ))}
        </section>
      ))}

      <Card id="report" className="scroll-mt-24 border-accent/30 bg-card p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-white">
            <ShieldCheck className="size-4.5" />
          </span>
          <div>
            <h2 className="text-lg font-bold">{c.vulnTitle}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              {c.vulnBody}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href="mailto:security@fidya.ai"
                className="inline-flex h-9 items-center rounded-full bg-accent px-4 text-xs font-semibold text-white transition-all hover:brightness-110"
              >
                {c.vulnCta}
              </a>
              <Link
                href="/status"
                className="inline-flex items-center gap-1.5 rounded-full border border-card-border px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent"
              >
                <Activity className="size-3.5" />
                {c.statusLink}
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <p className="text-[11px] text-muted">{c.updated}</p>
    </PageShell>
  );
}
