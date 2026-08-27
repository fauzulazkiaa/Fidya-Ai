"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Flame,
  PauseCircle,
  PlayCircle,
  Plus,
  Quote,
  Target,
  Trash2,
  Zap,
} from "lucide-react";
import { ModuleCard } from "@/components/dashboard/module-card";
import { CalendarMilestones } from "@/components/dashboard/calendar-milestones";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { CatalystCard } from "@/components/dashboard/catalyst-card";
import { ProductTour } from "@/components/layout/product-tour";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedBar, TickProgress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useApi, type Curriculum, type ProgressData } from "@/hooks/use-api";
import { useFidyaAuth } from "@/hooks/use-fidya-auth";
import type { LearningModule } from "@/lib/types";
import { cn } from "@/lib/utils";

function toLearningModule(m: Curriculum["modules"][number]): LearningModule {
  return { ...m } as unknown as LearningModule;
}

const QUOTES = [
  { text: "Little by little, one travels far.", by: "J.R.R. Tolkien" },
  { text: "The expert in anything was once a beginner.", by: "Helen Hayes" },
  { text: "Learning never exhausts the mind.", by: "Leonardo da Vinci" },
  { text: "An investment in knowledge pays the best interest.", by: "Benjamin Franklin" },
  { text: "It always seems impossible until it's done.", by: "Nelson Mandela" },
  { text: "The best way out is always through.", by: "Robert Frost" },
  { text: "Discipline is choosing between what you want now and what you want most.", by: "Abraham Lincoln" },
];

function greetingFor(hour: number) {
  if (hour < 5) return "Still up";
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

/** Skeleton mirroring the real dashboard layout 1:1 (desktop & mobile). */
function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 sm:px-6" aria-busy>
      {/* Greeting + resume CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="skeleton h-8 w-64" />
          <div className="skeleton h-3.5 w-80 max-w-full" />
        </div>
        <div className="skeleton hidden h-10 w-52 rounded-full sm:block" />
      </div>
      {/* Top banner */}
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="skeleton size-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-4 w-48 max-w-full" />
            <div className="skeleton h-3 w-72 max-w-full" />
          </div>
        </div>
        <div className="hidden w-56 shrink-0 space-y-2 sm:block">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-2.5 w-full rounded-full" />
        </div>
      </Card>
      {/* Bento module cards */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="space-y-3.5 p-6">
            <div className="flex items-start justify-between">
              <div className="skeleton size-10 rounded-xl" />
              <div className="skeleton size-8 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-5 w-20 rounded-full" />
            </div>
            <div className="skeleton h-2.5 w-full rounded-full pt-2" />
          </Card>
        ))}
      </div>
      {/* Milestones + activity */}
      <div className="grid gap-5 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="space-y-3 p-6">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-24 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const api = useApi();
  const { user: authUser } = useFidyaAuth();
  const [curricula, setCurricula] = useState<Curriculum[] | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [activeId, setActiveId] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Prefer the real name from the auth provider (captured at Google
  // sign-up) over the backend profile row.
  const resolvedName = authUser?.displayName || displayName;

  const load = useCallback(async () => {
    try {
      const [list, prog] = await Promise.all([
        api.listCurricula(),
        api.getProgress().catch(() => null),
      ]);
      setCurricula(list);
      if (prog) setProgress(prog);
      setActiveId((id) =>
        id || !list.length ? id : list.find((c) => c.status !== "paused")?.curriculum_id ?? list[0].curriculum_id
      );
    } catch {
      setCurricula([]);
    }
  }, [api]);

  useEffect(() => {
    Promise.resolve().then(load);
    api.getMe().then((me) => setDisplayName(me.display_name || "")).catch(() => {});
  }, [load, api]);

  async function togglePause(c: Curriculum) {
    const nextStatus =
      (c as { status?: string }).status === "paused" ? "active" : "paused";
    try {
      const res = await api.setCurriculumStatus(c.curriculum_id, nextStatus);
      setNotice(
        nextStatus === "active" && res.message
          ? res.message
          : `"${c.target_topic}" paused. Your deadline commitment is saved — resume anytime.`
      );
      await load();
    } catch (e) {
      setNotice(`⚠️ ${(e as Error).message}`);
    }
  }

  async function removeCurriculum(c: Curriculum) {
    try {
      await api.deleteCurriculum(c.curriculum_id);
      setNotice(`"${c.target_topic}" deleted.`);
      setActiveId("");
      setConfirmDelete(false);
      await load();
    } catch (e) {
      setNotice(`⚠️ ${(e as Error).message}`);
    }
  }

  if (curricula === null) return <DashboardSkeleton />;

  // Empty state — no curriculum yet
  if (curricula.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Card className="animate-fade-up mx-auto flex max-w-xl flex-col items-center p-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent text-white">
            <Target className="size-7" />
          </span>
          <h1 className="mt-5 text-xl font-bold tracking-tight">
            Welcome to Fidya
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            You don&apos;t have a curriculum yet. Tell The Architect what you
            want to master and your deadline — it builds the rest.
          </p>
          <Link href="/onboarding" className="mt-6">
            <Button size="lg">
              <Plus className="size-4" /> Create my first curriculum
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const active =
    curricula.find((c) => c.curriculum_id === activeId) ?? curricula[0];
  const isActive = (active as { status?: string }).status !== "paused";
  const activeModules = active.modules.filter(
    (m) => m.status === "in_progress" || m.status === "available"
  );
  // Resume-where-you-left-off: prefer the module currently in progress.
  const nextModule =
    active.modules.find((m) => m.status === "in_progress") ??
    activeModules[0];
  const recent = active.modules.slice(0, 3);
  const doneCount = active.modules.filter((m) => m.status === "completed").length;
  const overall =
    active.modules.length > 0
      ? Math.round((doneCount / active.modules.length) * 100)
      : 0;
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const firstName = resolvedName.split(" ")[0] || "learner";

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 sm:px-6">
      {/* First-visit guided tour */}
      <ProductTour />

      {/* Greeting + daily quote */}
      <header
        data-tour="welcome"
        className="animate-fade-up flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {greetingFor(new Date().getHours())}, {firstName}
            <span className="text-accent">.</span>
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <Quote className="size-3 shrink-0" />
            &ldquo;{quote.text}&rdquo; — {quote.by}
          </p>
        </div>
        {/* Primary action: resume exactly where they left off */}
        {nextModule && isActive && (
          <Link
            href={`/curriculum/${nextModule.module_id}`}
            data-tour="continue"
            className="shrink-0"
          >
            <Button
              size="lg"
              className="group max-w-full rounded-full shadow-[0_4px_16px_rgba(79,70,229,0.35)]"
            >
              <PlayCircle className="size-4.5 shrink-0 transition-transform group-hover:scale-110" />
              <span>Lanjutkan</span>
              <span className="hidden max-w-40 truncate font-normal opacity-80 md:inline">
                {nextModule.title}
              </span>
              <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        )}
      </header>

      {notice && (
        <Card className="animate-fade-up flex items-start gap-3 border-accent/40 bg-accent-soft/60 p-4">
          <Flame className="mt-0.5 size-4 shrink-0 text-accent" />
          <p className="text-xs leading-relaxed">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="ml-auto shrink-0 text-xs text-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </Card>
      )}

      {/* Top banner */}
      <Card
        data-tour="progress"
        className="animate-fade-up flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
            <Flame className="size-6" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {/* Multi-curriculum switcher */}
              {curricula.length > 1 ? (
                <div className="flex max-w-md flex-wrap gap-1.5">
                  {curricula.map((c) => {
                    const selected = c.curriculum_id === active.curriculum_id;
                    const paused = (c as { status?: string }).status === "paused";
                    return (
                      <button
                        key={c.curriculum_id}
                        type="button"
                        onClick={() => setActiveId(c.curriculum_id)}
                        title={c.target_topic}
                        className={cn(
                          "max-w-48 truncate rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          selected
                            ? "border-accent bg-accent text-white shadow-[0_2px_8px_rgba(79,70,229,0.3)]"
                            : "border-card-border bg-card text-muted hover:border-accent/40 hover:text-foreground"
                        )}
                      >
                        {paused && "⏸ "}
                        {c.target_topic}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">
                    {active.target_topic}
                  </p>
                  {!isActive && <Badge tone="destructive">Paused</Badge>}
                </div>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">
              {doneCount}/{active.modules.length} modules ·{" "}
              {active.hours_per_week}h/week committed ·{" "}
              {progress ? `${progress.streak_days}-day streak` : "keep going!"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => togglePause(active)}
            title={isActive ? "Pause this curriculum" : "Resume with a fresh plan"}
          >
            {isActive ? (
              <>
                <PauseCircle className="size-4" /> Pause
              </>
            ) : (
              <>
                <PlayCircle className="size-4" /> Resume
              </>
            )}
          </Button>
          {confirmDelete ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="text-red-500 hover:bg-red-500/10"
                onClick={() => removeCurriculum(active)}
              >
                Confirm delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              title="Delete this curriculum permanently"
              aria-label={`Delete ${active.target_topic}`}
              onClick={() => setConfirmDelete(true)}
              className="text-muted hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
          <div className="min-w-[160px] flex-1 sm:max-w-xs">
            <div className="flex justify-between text-xs text-muted">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Zap className="size-3.5 text-accent-strong" />
                Progress
              </span>
              <span className="tabular-nums">{overall}%</span>
            </div>
            <div className="mt-2">
              <SegmentedBar
                segments={[
                  { label: "done", color: "var(--accent-strong)", pct: overall },
                  { label: "rest", color: "var(--tick-empty)", pct: Math.max(0, 100 - overall) },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {!isActive && (
        <Card className="animate-fade-up border-dashed p-4 text-center text-xs text-muted">
          This curriculum is paused. You committed to finishing by{" "}
          {active.target_deadline} — hit Resume and The Architect will re-plan
          your remaining modules around your deadline.
        </Card>
      )}

      {/* Bento grid */}
      <section
        data-tour="modules"
        aria-label="Active modules"
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      >
        {recent.map((m, i) => (
          <div
            key={m.module_id}
            className="animate-fade-up"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <ModuleCard module={toLearningModule(m)} />
          </div>
        ))}
        <Link href="/onboarding" style={{ animationDelay: "210ms" }}>
          <Card className="flex h-full min-h-44 flex-col items-start justify-between border-dashed p-6 transition-colors hover:border-accent/40 hover:bg-accent-soft">
            <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Plus className="size-5" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold">New Learning Goal</h3>
              <p className="mt-0.5 text-xs text-muted">
                Let The Architect design your next curriculum
              </p>
            </div>
          </Card>
        </Link>
      </section>

      {/* Milestones */}
      {active.milestones?.length > 0 && (
        <CalendarMilestones milestones={active.milestones} />
      )}

      {/* Catalyst Inspiration Card (US-019) */}
      <CatalystCard
        concept={
          active.modules.find((m) => m.status === "in_progress")?.title ??
          active.modules[0]?.title
        }
      />

      {/* Progress insights (merged from Analytics) */}
      {progress && (
        <section aria-label="Progress insights" className="space-y-5">
          <ActivityChart
            data={progress.velocity ?? []}
            subtitle={`Last 7 days · ${(progress.velocity ?? [])
              .reduce((s, v) => s + v.hours, 0)
              .toFixed(1)}h logged`}
          />
          <Card className="animate-fade-up p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">Conceptual Mastery</h3>
              <span className="text-xs text-muted">
                The Inquisitor scores · 1–5
              </span>
            </div>
            {(progress.mastery?.length ?? 0) === 0 ? (
              <p className="mt-5 rounded-2xl bg-background p-4 text-xs leading-relaxed text-muted">
                No mastery scores yet. Chat with The Inquisitor under AI Tutor
                and your conceptual mastery per module will appear here.
              </p>
            ) : (
              <ul className="mt-5 grid gap-x-8 gap-y-3.5 md:grid-cols-2">
                {progress.mastery.map((m) => (
                  <li key={m.concept} className="flex items-center gap-3">
                    <span className="w-28 min-w-0 shrink-0 truncate text-xs font-medium sm:w-32">
                      {m.concept}
                    </span>
                    <TickProgress
                      value={(m.score / 5) * 100}
                      ticks={5}
                      className="min-w-0 flex-1"
                    />
                    <Badge tone={m.score >= 4 ? "public" : "neutral"}>
                      {m.score}/5
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      )}

      {/* Practice CTA */}
      <Card className="animate-fade-up flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-citation-public/10 text-citation-public">
            <BookOpen className="size-6" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              {progress
                ? `${progress.modules_completed}/${progress.modules_total} completed · ${progress.hours_studied}h studied`
                : `${activeModules.length} modules ready`}
            </p>
            <p className="text-xs text-muted">
              Keep the momentum — practice with The Inquisitor today
            </p>
          </div>
        </div>
        <Link
          href={`/tutor?curriculum=${active.curriculum_id}&module=${activeModules[0]?.module_id ?? ""}`}
        >
          <Button variant="secondary">
            Practice now
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </Card>
    </div>
  );
}
