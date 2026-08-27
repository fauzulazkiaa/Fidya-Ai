"use client";

import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TickProgress } from "@/components/ui/progress";
import type { LearningModule } from "@/lib/types";

const STATUS_STYLE: Record<
  LearningModule["status"],
  { label: string; tone: "neutral" | "accent" | "public" }
> = {
  locked: { label: "Locked", tone: "neutral" },
  available: { label: "Ready", tone: "accent" },
  in_progress: { label: "In Progress", tone: "accent" },
  completed: { label: "Completed", tone: "public" },
};

export function ModuleCard({ module }: { module: LearningModule }) {
  const locked = module.status === "locked";
  const status = STATUS_STYLE[module.status];

  return (
    <Card className="group flex h-full flex-col gap-4 p-6 transition-shadow duration-200 hover:shadow-[0_12px_32px_rgba(15,23,42,0.10)]">
      {/* Top row: meta + actions */}
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium uppercase tracking-wider text-muted">
          Week {module.week} · Day {module.day}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {locked ? (
            <span className="flex size-7 items-center justify-center rounded-full bg-tick-empty/60 text-muted">
              <Lock className="size-3.5" />
            </span>
          ) : (
            <Link
              href={`/curriculum/${module.module_id}`}
              aria-label={`Open ${module.title}`}
              className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-accent transition-transform duration-150 hover:scale-110"
            >
              <ArrowUpRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Title block */}
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">
          {module.title}
        </h3>
        <p className="mt-1 truncate text-xs text-muted">{module.domain}</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {module.tags.slice(0, 3).map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>

      {/* Footer stats */}
      <div className="mt-auto space-y-2.5 border-t border-card-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
          <span className="min-w-0 text-muted">{module.estimated_hours} Hours · Intermediate</span>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <TickProgress value={module.completion} ticks={18} />
          <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums">
            {module.completion}%
          </span>
        </div>
      </div>
    </Card>
  );
}
