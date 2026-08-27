"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
  BookOpen,
  Check,
  CheckCircle2,
  ListChecks,
  Loader2,
  Maximize2,
  Minimize2,
  Printer,
  Sparkles,
  Target,
} from "lucide-react";
import { CitationText, SourcesDrawer } from "@/components/reader/citations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TickProgress } from "@/components/ui/progress";
import { useApi, type Curriculum, type CurriculumModule } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

export default function ModuleReaderPage() {
  const params = useParams<{ module_id: string }>();
  const api = useApi();
  const [curricula, setCurricula] = useState<Curriculum[] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [busy, setBusy] = useState<"synthesize" | "complete" | null>(null);
  const [synthError, setSynthError] = useState("");
  const [readPct, setReadPct] = useState(0);
  // Focus Mode: hides navbar/footer/support chrome so only the lesson and
  // its actions remain. Esc always exits.
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("focus-mode", focusMode);
    return () => document.body.classList.remove("focus-mode");
  }, [focusMode]);

  useEffect(() => {
    if (!focusMode) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFocusMode(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusMode]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // Reset reading progress when navigating between modules.
  useEffect(() => {
    return () => setReadPct(0);
  }, [params.module_id]);

  const load = useCallback(async () => {
    try {
      setCurricula(await api.listCurricula());
    } catch {
      setCurricula([]);
    }
  }, [api]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  // Reading progress
  useEffect(() => {
    if (!curricula) return;
    function onScroll() {
      const el = document.getElementById("lesson-body");
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight * 0.5;
      const scrolled = Math.min(
        Math.max(-el.getBoundingClientRect().top, 0),
        Math.max(total, 1)
      );
      setReadPct(Math.round((scrolled / Math.max(total, 1)) * 100));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [curricula]);

  const currentModule: CurriculumModule | undefined = useMemo(() => {
    for (const c of curricula ?? []) {
      const m = c.modules.find((mm) => mm.module_id === params.module_id);
      if (m) return m;
    }
    return undefined;
  }, [curricula, params]);

  const parentCurriculum = useMemo(
    () => curricula?.find((c) => c.modules.some((m) => m.module_id === params.module_id)),
    [curricula, params]
  );

  async function synthesize() {
    if (!parentCurriculum || !currentModule || busy) return;
    setBusy("synthesize");
    setSynthError("");
    try {
      const result = await api.synthesizeModule(
        parentCurriculum.curriculum_id,
        currentModule.module_id
      );
      await load();
      if (result.status === "insufficient_data") {
        setSynthError(
          "The Hunter belum menemukan sumber kredibel yang cukup untuk modul ini. Coba lagi nanti, atau unggah dokumenmu sendiri agar pelajaran disusun dari materi pribadimu."
        );
      }
    } catch (e) {
      setSynthError(`Sintesis gagal: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  async function toggleComplete() {
    if (!parentCurriculum || !currentModule || busy) return;
    setBusy("complete");
    try {
      await api.completeModule(
        parentCurriculum.curriculum_id,
        currentModule.module_id,
        currentModule.status !== "completed"
      );
      // Feed streak & analytics with real study telemetry.
      if (currentModule.status !== "completed") {
        api
          .trackEvent(
            "module_complete",
            `${currentModule.title}|h:${currentModule.estimated_hours ?? 1}`
          )
          .catch(() => {});
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (curricula === null || !currentModule) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 px-4 sm:px-6" aria-busy>
        <div className="skeleton h-4 w-32" />
        <div className="flex gap-2">
          <div className="skeleton h-5 w-24 rounded-full" />
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="skeleton h-7 w-full" />
          <div className="skeleton h-7 w-2/3" />
        </div>
        <Card className="mt-6 space-y-3 p-5">
          <div className="skeleton h-4 w-44" />
          <div className="skeleton h-3.5 w-full" />
          <div className="skeleton h-3.5 w-5/6" />
          <div className="skeleton h-3.5 w-4/6" />
        </Card>
        <Card className="mt-5 space-y-3 p-5 sm:p-8">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="skeleton h-3.5"
              style={{ width: `${88 - (i % 3) * 14}%` }}
            />
          ))}
        </Card>
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      {/* Reading progress */}
      {currentModule.content_markdown && (
        <div aria-hidden className="fixed inset-x-0 top-[62px] z-30 h-0.5 bg-transparent px-4">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-150"
            style={{ width: `${readPct}%` }}
          />
        </div>
      )}

      {/* Focus-mode exit affordance */}
      {focusMode && (
        <button
          type="button"
          onClick={() => setFocusMode(false)}
          className="app-chrome fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-card-border bg-card/90 px-4 py-2 text-[11px] font-semibold text-muted shadow-lg backdrop-blur transition-colors hover:text-accent"
        >
          <Minimize2 className="mr-1 inline size-3" /> Exit Focus Mode (Esc)
        </button>
      )}

      {/* Header */}
      <div className="animate-fade-up">
        <div className="flex items-start justify-between gap-3">
          <Link
            href="/curriculum"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> My Curriculum
          </Link>
          {/* Reader tools */}
          <div className="flex shrink-0 items-center gap-1">
            {currentModule.content_markdown && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Focus Mode — hide all distractions (Esc to exit)"
                  aria-label="Toggle focus mode"
                  onClick={() => setFocusMode((f) => !f)}
                >
                  {focusMode ? (
                    <Minimize2 className="size-4" />
                  ) : (
                    <Maximize2 className="size-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Export / print as PDF"
                  aria-label="Export lesson"
                  onClick={() => window.print()}
                >
                  <Printer className="size-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <Badge tone="accent">
            Week {currentModule.week} · Day {currentModule.day}
          </Badge>
          {currentModule.tags.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{currentModule.title}</h1>
        <div className="mt-2 flex items-center gap-4">
          <span className="text-xs text-muted">{currentModule.domain}</span>
          <span className="text-xs text-muted">{currentModule.estimated_hours} hours</span>
          {currentModule.completion > 0 && (
            <span className="flex items-center gap-2">
              <TickProgress value={currentModule.completion} ticks={10} />
              <span className="text-xs font-semibold tabular-nums">
                {currentModule.completion}%
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Objectives */}
      <Card className="animate-fade-up mt-6 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Target className="size-4 text-accent" /> Learning Objectives
        </h2>
        <ul className="mt-3 space-y-2">
          {currentModule.objectives.map((obj) => (
            <li key={obj} className="flex items-start gap-2 text-sm text-muted">
              <Check className="mt-0.5 size-3.5 shrink-0 text-citation-public" />
              {obj}
            </li>
          ))}
        </ul>
      </Card>

      {/* Lesson content */}
      {currentModule.content_markdown ? (
        <>
          <Card id="lesson-body" className="animate-fade-up mt-5 p-5 sm:p-8">
            <article className="space-y-5 text-[15px] leading-[1.85]">
              {currentModule.content_markdown.split("\n\n").map((para, i) => (
                <p key={i}>
                  <CitationText text={para} citations={currentModule.citations ?? []} />
                </p>
              ))}
            </article>
            <div className="mt-8 border-t border-card-border pt-4">
              <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
                <ListChecks className="size-3.5" />
                View all sources ({currentModule.citations?.length ?? 0})
              </Button>
            </div>
          </Card>

          {/* Actions */}
          <div className="animate-fade-up mt-5 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
            <Link
              href={`/tutor?module=${currentModule.module_id}`}
              className="sm:contents"
            >
              <Button className="w-full sm:w-auto">
                <Sparkles className="size-4" /> Practice with The Inquisitor
              </Button>
            </Link>
            <Link href="/forge" className="sm:contents">
              <Button variant="secondary" className="w-full sm:w-auto">
                Submit work to The Forge
              </Button>
            </Link>
            <Button
              variant={currentModule.status === "completed" ? "secondary" : "primary"}
              disabled={busy !== null}
              onClick={toggleComplete}
              className="w-full sm:ml-auto sm:w-auto"
            >
              {currentModule.status === "completed" ? (
                <>
                  <CheckCircle2 className="size-4" /> Completed
                </>
              ) : (
                <>
                  {busy === "complete" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Mark as complete
                </>
              )}
            </Button>
          </div>
        </>
      ) : currentModule.status === "locked" ? (
        <Card className="animate-fade-up mt-5 flex flex-col items-center justify-center p-12 text-center opacity-70">
          <BookOpen className="size-8 text-muted" />
          <p className="mt-3 text-sm font-medium">Complete previous modules to unlock.</p>
        </Card>
      ) : (
        <Card className="animate-fade-up mt-5 flex flex-col items-center justify-center p-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Sparkles className="size-7" />
          </span>
          <h2 className="mt-4 text-base font-semibold">Lesson not synthesized yet</h2>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">
            The Hunter → Synthesizer → Fact-Checker pipeline will fetch real
            sources and compile this module with grounded citations.
          </p>
          {synthError && (
            <div className="mt-4 flex w-full max-w-sm items-start gap-2.5 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3.5 text-left">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-500" />
              <p className="text-xs leading-relaxed text-orange-600 dark:text-orange-400">
                {synthError}
              </p>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setSynthError("")}
                className="ml-auto shrink-0 text-xs text-orange-500 hover:text-orange-700"
              >
                ✕
              </button>
            </div>
          )}
          <Button
            className="mt-5"
            onClick={synthesize}
            disabled={busy !== null}
          >
            {busy === "synthesize" ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Running agents…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                {synthError ? "Try again" : "Synthesize this module"}
              </>
            )}
          </Button>
          <p className="mt-2 text-[11px] text-muted">
            Fetches live sources · ~20–60 seconds
          </p>
        </Card>
      )}

      {/* Prev / Next navigation */}
      {parentCurriculum && (
        <nav
          aria-label="Module navigation"
          className="animate-fade-up mt-8 grid grid-cols-2 gap-3"
        >
          {(() => {
            const idx = parentCurriculum.modules.findIndex(
              (m) => m.module_id === currentModule.module_id
            );
            const prev = idx > 0 ? parentCurriculum.modules[idx - 1] : null;
            const next =
              idx < parentCurriculum.modules.length - 1
                ? parentCurriculum.modules[idx + 1]
                : null;
            return (
              <>
                {prev && prev.status !== "locked" ? (
                  <Link href={`/curriculum/${prev.module_id}`} className="min-w-0">
                    <Card className="group flex h-full items-center gap-2 p-4 transition-shadow hover:shadow-md">
                      <ArrowLeft className="size-4 shrink-0 text-muted transition-transform group-hover:-translate-x-0.5" />
                      <span className="min-w-0">
                        <span className="block text-[10px] uppercase tracking-wider text-muted">
                          Previous
                        </span>
                        <span className="block truncate text-xs font-medium">
                          {prev.title}
                        </span>
                      </span>
                    </Card>
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    href={`/curriculum/${next.module_id}`}
                    className="min-w-0"
                    onClick={(e) => {
                      if (next.status === "locked") e.preventDefault();
                    }}
                  >
                    <Card
                      className={cn(
                        "group flex h-full items-center justify-end gap-2 p-4 transition-shadow hover:shadow-md",
                        next.status === "locked" && "opacity-50"
                      )}
                    >
                      <span className="min-w-0 text-right">
                        <span className="block text-[10px] uppercase tracking-wider text-muted">
                          Next
                        </span>
                        <span className="block truncate text-xs font-medium">
                          {next.title}
                        </span>
                      </span>
                      <ArrowRightIcon className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
                    </Card>
                  </Link>
                ) : (
                  <span />
                )}
              </>
            );
          })()}
        </nav>
      )}

      <SourcesDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        citations={currentModule.citations ?? []}
      />
    </div>
  );
}
