"use client";

import { BookOpenCheck, Check, ShieldCheck, Telescope } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

/** Hunter → Synthesizer → Fact-Checker flow with moving data dots
 *  and a rewrite loop-back. Pure CSS/SVG — no image assets. */
export function PipelineFlow() {
  const { locale } = useLocale();
  const c = getCopy("home", locale).illustrations;
  const nodes = [
    { icon: Telescope, label: "The Hunter", sub: "arXiv · Wikipedia · S2" },
    { icon: BookOpenCheck, label: "Synthesizer", sub: "inline [chunk_id]" },
    { icon: ShieldCheck, label: "Fact-Checker", sub: "entailment guard" },
  ];

  return (
    <Card className="w-full p-6 sm:p-8">
      <div className="flex items-center justify-between gap-1">
        {nodes.map((n, i) => (
          <div key={n.label} className="contents">
            <div className="flex w-[30%] flex-col items-center gap-2 rounded-2xl border border-card-border bg-background p-3 text-center sm:p-4">
              <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-accent">
                <n.icon className="size-4" />
              </span>
              <p className="text-[11px] font-bold leading-tight">{n.label}</p>
              <p className="hidden text-[9px] leading-tight text-muted sm:block">
                {n.sub}
              </p>
            </div>
            {i < nodes.length - 1 && (
              <div className="relative mx-1 h-[2px] flex-1 overflow-visible rounded-full bg-tick-empty">
                <span
                  className="animate-dot-move absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-accent-strong"
                  style={{ animationDelay: `${i * 0.55}s` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rewrite loop-back */}
      <div className="relative mt-4 h-9">
        <svg className="absolute inset-x-0 top-0 h-4 w-full" fill="none">
          <path
            d="M 84 0 C 84 26, 60 24, 52 28"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            strokeLinecap="round"
            className="animate-dash-flow opacity-50"
          />
        </svg>
        <p className="absolute inset-x-0 top-3 text-center text-[10px] font-medium text-muted">
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">
            {c.rewriteLoop}
          </span>
        </p>
      </div>

      {/* Result strip */}
      <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-citation-public/10 px-4 py-3">
        <Check className="size-4 shrink-0 text-citation-public" />
        <p className="text-[11px] font-medium text-citation-public">
          {c.resultStrip}
        </p>
      </div>
    </Card>
  );
}

/** Weekly mastery rise — animated bars + streak calendar mini-grid. */
export function MasteryRise() {
  const { locale } = useLocale();
  const c = getCopy("home", locale).illustrations;
  const bars = [35, 48, 42, 62, 58, 78, 92];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const active = new Set([1, 2, 4, 5, 6]);

  return (
    <Card className="w-full p-6 sm:p-8">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold">{c.conceptualMastery}</p>
        <span className="text-[10px] text-muted">{c.scoredBy}</span>
      </div>

      {/* Bars */}
      <div className="mt-5 flex h-32 items-end gap-2.5 sm:gap-3">
        {bars.map((h, i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="text-[9px] font-medium tabular-nums text-muted">
              {h >= 60 ? `${h}%` : ""}
            </span>
            <div
              className="animate-bar-rise w-full max-w-7 rounded-t-lg bg-gradient-to-t from-accent to-accent-strong"
              style={{ height: `${(h / 100) * 96}px`, animationDelay: `${i * 90}ms` }}
            />
            <span className="text-[9px] font-medium text-muted">{days[i]}</span>
          </div>
        ))}
      </div>

      {/* Streak calendar strip */}
      <div className="mt-5 flex items-center justify-between border-t border-card-border pt-4">
        <div>
          <p className="text-[10px] font-medium text-muted">{c.thisWeek}</p>
          <p className="text-xs font-bold">{c.activeDays}</p>
        </div>
        <div className="flex gap-1">
          {days.map((d, i) => (
            <span
              key={i}
              className={cn(
                "flex size-6 items-center justify-center rounded-md text-[9px] font-semibold",
                active.has(i)
                  ? "bg-citation-public/15 text-citation-public"
                  : "bg-tick-empty/50 text-muted"
              )}
            >
              {active.has(i) ? <Check className="size-3" /> : d}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
