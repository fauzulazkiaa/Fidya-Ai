"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  PauseCircle,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedBar, TickProgress } from "@/components/ui/progress";
import { useApi, type Curriculum, type CurriculumModule } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

type Filter = "all" | "active" | "completed";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

type WithStatus = Curriculum & { status?: string };

function progressOf(c: Curriculum) {
  const done = c.modules.filter((m) => m.status === "completed").length;
  return {
    done,
    pct: c.modules.length ? Math.round((done / c.modules.length) * 100) : 0,
  };
}

function CurriculumInner() {
  const api = useApi();
  const searchParams = useSearchParams();
  const [curricula, setCurricula] = useState<Curriculum[] | null>(null);
  const [activeId, setActiveId] = useState<string>("");
  const [filter, setFilter] = useState<Filter>("all");
  const [justGenerated, setJustGenerated] = useState(false);
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");

  const load = useCallback(async () => {
    try {
      const list = await api.listCurricula();
      setCurricula(list);
      const requested =
        searchParams.get("id") || searchParams.get("curriculum") || "";
      setActiveId(
        (id) =>
          id ||
          (requested && list.some((c) => c.curriculum_id === requested)
            ? requested
            : "") ||
          list[0]?.curriculum_id ||
          ""
      );
    } catch {
      setCurricula([]);
    }
  }, [api, searchParams]);

  useEffect(() => {
    Promise.resolve().then(load);
    if (window.location.search.includes("generated=1")) {
      Promise.resolve().then(() => {
        setJustGenerated(true);
        window.history.replaceState(null, "", "/curriculum");
      });
    }
  }, [load]);

  async function togglePause(c: WithStatus) {
    const next = c.status === "paused" ? "active" : "paused";
    try {
      const res = await api.setCurriculumStatus(c.curriculum_id, next);
      setNotice(
        next === "active" && res.message
          ? res.message
          : `"${c.target_topic}" paused — resume anytime and The Architect re-plans the rest.`
      );
      await load();
    } catch (e) {
      setNotice(`⚠️ ${(e as Error).message}`);
    }
  }

  async function remove(c: WithStatus) {
    try {
      await api.deleteCurriculum(c.curriculum_id);
      setNotice(`"${c.target_topic}" deleted.`);
      setActiveId("");
      setConfirmDelete("");
      await load();
    } catch (e) {
      setNotice(`⚠️ ${(e as Error).message}`);
    }
  }

  if (curricula === null) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6" aria-busy>
        <div className="skeleton h-3.5 w-40" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className="skeleton size-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4 max-w-full" />
                  <div className="skeleton h-3 w-1/2 max-w-full" />
                </div>
              </div>
              <div className="skeleton h-2.5 w-full rounded-full border-t border-card-border pt-3" />
            </Card>
          ))}
        </div>
        <div className="space-y-2 pt-2">
          <div className="skeleton h-7 w-64 max-w-full" />
          <div className="flex gap-2">
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-5 w-24 rounded-full" />
            <div className="skeleton h-5 w-28 rounded-full" />
          </div>
        </div>
        <Card className="flex items-center justify-between p-5">
          <div className="space-y-2">
            <div className="skeleton h-4 w-48" />
            <div className="skeleton h-3 w-32" />
          </div>
          <div className="skeleton h-3 w-40 rounded-full" />
        </Card>
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="skeleton size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="skeleton h-4 w-2/3 max-w-full" />
              <div className="skeleton h-3 w-1/3 max-w-full" />
            </div>
            <div className="skeleton hidden h-3 w-32 shrink-0 rounded-full sm:block" />
          </Card>
        ))}
      </div>
    );
  }

  if (curricula.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Card className="p-12 text-center">
          <p className="text-sm text-muted">
            No curriculum yet.{" "}
            <Link href="/onboarding" className="text-accent underline underline-offset-2">
              Create one
            </Link>
            .
          </p>
        </Card>
      </div>
    );
  }

  const syllabus =
    (curricula.find((c) => c.curriculum_id === activeId) as WithStatus) ??
    (curricula[0] as WithStatus);

  const overall = progressOf(syllabus).pct;

  const visibleModules: CurriculumModule[] =
    filter === "all"
      ? syllabus.modules
      : filter === "completed"
        ? syllabus.modules.filter((m) => m.status === "completed")
        : syllabus.modules.filter(
            (m) => m.status === "in_progress" || m.status === "available"
          );

  const visibleWeeks = [...new Set(visibleModules.map((m) => m.week))].sort(
    (a, b) => a - b
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
      {justGenerated && (
        <Card className="animate-fade-up flex items-center gap-3 border-citation-public/30 bg-citation-public/5 p-4">
          <CheckCircle2 className="size-5 shrink-0 text-citation-public" />
          <p className="min-w-0 flex-1 text-xs leading-relaxed">
            <strong>New syllabus ready.</strong>{" "}
            <span className="text-muted">
              The Architect tailored this curriculum to your baseline and
              deadline.
            </span>
          </p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setJustGenerated(false)}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-tick-empty/50"
          >
            ✕
          </button>
        </Card>
      )}

      {notice && (
        <Card className="animate-fade-up flex items-start gap-3 border-accent/40 bg-accent-soft/60 p-4">
          <p className="min-w-0 flex-1 text-xs leading-relaxed">{notice}</p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setNotice("")}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-tick-empty/50"
          >
            ✕
          </button>
        </Card>
      )}

      {/* All curricula — a tidy 2-col card grid, newest first */}
      <section aria-label="Your curricula">
        <h2 className="animate-fade-up text-xs font-medium uppercase tracking-wider text-muted">
          My Curricula ({curricula.length})
        </h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {curricula.map((raw, i) => {
            const c = raw as WithStatus;
            const { done, pct } = progressOf(c);
            const selected = c.curriculum_id === syllabus.curriculum_id;
            const paused = c.status === "paused";
            return (
              <Card
                key={c.curriculum_id}
                className={cn(
                  "group animate-fade-up cursor-pointer p-5 transition-all",
                  selected
                    ? "border-accent shadow-[0_0_0_1px_var(--accent)]"
                    : "hover:border-accent/40 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
                )}
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => setActiveId(c.curriculum_id)}
              >
                {/* Header row: marker + title + status */}
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      paused
                        ? "bg-tick-empty/60 text-muted"
                        : c.status === "completed"
                          ? "bg-citation-public/15 text-citation-public"
                          : "bg-accent-soft text-accent"
                    )}
                  >
                    {paused ? <PauseCircle className="size-4" /> : pct}%
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold leading-snug">
                        {c.target_topic}
                      </h3>
                      {paused ? (
                        <Badge tone="destructive">Paused</Badge>
                      ) : c.status === "completed" ? (
                        <Badge tone="public">Completed</Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {done}/{c.modules.length} modul ·{" "}
                      {new Date(
                        c.target_deadline + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Actions — revealed on hover to keep rows calm */}
                  <div
                    className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      title={paused ? "Resume" : "Pause"}
                      aria-label={paused ? "Resume" : "Pause"}
                      onClick={() => togglePause(c)}
                    >
                      {paused ? (
                        <PlayCircle className="size-4" />
                      ) : (
                        <PauseCircle className="size-4" />
                      )}
                    </Button>
                    {confirmDelete === c.curriculum_id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-500/10"
                          onClick={() => remove(c)}
                        >
                          Hapus?
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete("")}
                        >
                          Batal
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted hover:bg-red-500/10 hover:text-red-500"
                        title="Delete permanently"
                        aria-label={`Delete ${c.target_topic}`}
                        onClick={() => setConfirmDelete(c.curriculum_id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress footer */}
                <div className="mt-4 flex items-center gap-3 border-t border-card-border pt-3">
                  <SegmentedBar
                    segments={[
                      { label: "done", color: "var(--accent-strong)", pct },
                      { label: "rest", color: "var(--tick-empty)", pct: 100 - pct },
                    ]}
                  />
                  <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted">
                    {pct}%
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Selected curriculum detail */}
      <header className="animate-fade-up border-t border-card-border pt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Syllabus
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {syllabus.target_topic}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          <Badge tone="accent">{syllabus.current_level}</Badge>
          <Badge>{syllabus.hours_per_week} h/week</Badge>
          <Badge>{syllabus.learning_style}</Badge>
          {(syllabus as WithStatus).status === "paused" && (
            <Badge tone="destructive">Paused</Badge>
          )}
          <Link href={`/tutor?curriculum=${syllabus.curriculum_id}`}>
            <Button variant="ghost" size="sm" className="ml-1 text-accent hover:text-accent">
              Practice <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Filters */}
      <div className="animate-fade-up flex items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
              filter === f.id
                ? "border-accent bg-accent text-white shadow-[0_2px_8px_rgba(79,70,229,0.3)]"
                : "border-card-border bg-card text-muted hover:border-accent/40 hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="animate-fade-up flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-semibold">
            {progressOf(syllabus).done} of {syllabus.modules.length} modules completed
          </p>
          <p className="text-xs text-muted">{overall}% overall progress</p>
        </div>
        <TickProgress value={overall} ticks={28} />
      </Card>

      {visibleWeeks.map((week) => (
        <section key={week} className="animate-fade-up">
          <h2 className="mb-3 text-sm font-semibold text-muted">Week {week}</h2>
          <ul className="space-y-2.5">
            {visibleModules
              .filter((m) => m.week === week)
              .map((m) => (
                <ModuleRow key={m.module_id} module={m} />
              ))}
          </ul>
        </section>
      ))}
      {visibleModules.length === 0 && (
        <Card className="animate-fade-up p-10 text-center text-sm text-muted">
          No modules in this filter yet.
        </Card>
      )}

      {syllabus.milestones?.length > 0 && (
        <section className="animate-fade-up">
          <h2 className="mb-3 text-sm font-semibold text-muted">Milestones</h2>
          <Card className="divide-y divide-card-border overflow-hidden">
            {syllabus.milestones.map((ms) => (
              <div key={ms.id} className="flex items-center gap-4 px-5 py-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent">
                  W{ms.week}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{ms.title}</p>
                  <p className="text-[11px] capitalize text-muted">{ms.kind}</p>
                </div>
                <span className="rounded-full bg-tick-empty/60 px-2.5 py-1 text-[11px] font-medium tabular-nums text-muted">
                  {new Date(ms.date + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}

function ModuleRow({ module }: { module: CurriculumModule }) {
  const locked = module.status === "locked";
  const inner = (
    <>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          module.status === "completed" && "bg-citation-public/15 text-citation-public",
          module.status === "in_progress" && "bg-accent text-white",
          module.status === "available" && "bg-accent-soft text-accent",
          locked && "bg-tick-empty/50 text-muted"
        )}
      >
        {locked ? <Lock className="size-4" /> : module.order}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{module.title}</p>
        <p className="text-[11px] text-muted">
          Day {module.day} · {module.domain} · {module.estimated_hours}h
        </p>
      </div>
      <TickProgress value={module.completion} ticks={14} className="hidden w-32 shrink-0 sm:flex" />
      <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums">
        {module.completion}%
      </span>
    </>
  );

  return (
    <li>
      {locked ? (
        <Card className="flex items-center gap-4 px-5 py-4 opacity-60">{inner}</Card>
      ) : (
        <Link href={`/curriculum/${module.module_id}`}>
          <Card className="flex items-center gap-4 px-5 py-4 transition-shadow hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
            {inner}
          </Card>
        </Link>
      )}
    </li>
  );
}

export default function CurriculumPage() {
  return (
    <Suspense fallback={null}>
      <CurriculumInner />
    </Suspense>
  );
}
