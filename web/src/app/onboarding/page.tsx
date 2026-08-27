"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Compass,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TickProgress } from "@/components/ui/progress";
import { useApi } from "@/hooks/use-api";
import { readLocalPlan, resolvePlan } from "@/lib/plan";
import type { OnboardingPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["Goal & Deadline", "Baseline", "Time Commitment", "Review"] as const;

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const STYLES = [
  { id: "Project-based", desc: "Learn by shipping real artifacts" },
  { id: "Reading-first", desc: "Deep dives before hands-on work" },
  { id: "Socratic drills", desc: "Question-driven mastery loops" },
] as const;
const HOURS = [4, 6, 10, 12, 15, 20] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const api = useApi();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<OnboardingPayload | null>(null);
  const [existingCount, setExistingCount] = useState(0);

  useEffect(() => {
    Promise.resolve().then(async () => {
      // Returning learner? Offer a shortcut back to the dashboard.
      api
        .listCurricula()
        .then((list) => setExistingCount(list.length))
        .catch(() => {});
      // Pre-fill from Learning Defaults in Settings when available.
      const base = {
        target_topic: "",
        current_level: "Intermediate",
        target_outcome: "",
        target_deadline: new Date(Date.now() + 60 * 24 * 3600 * 1000)
          .toISOString()
          .slice(0, 10),
        hours_per_week: 10,
        learning_style: "Project-based",
      };
      try {
        const raw = localStorage.getItem("fidya.settings");
        if (raw) {
          const s = JSON.parse(raw);
          if (s.default_level) base.current_level = s.default_level;
          if (s.default_hours) base.hours_per_week = s.default_hours;
        }
      } catch {
        /* noop */
      }
      setPayload(base);
    });
  }, []);

  const set = <K extends keyof OnboardingPayload>(
    key: K,
    value: OnboardingPayload[K]
  ) => setPayload((p) => (p ? { ...p, [key]: value } : p));

  if (!payload) return null;

  const canNext = step !== 0 || payload.target_topic.trim() !== "";

  async function generate() {
    if (saving || !payload) return;
    // Free plan allows one active curriculum at a time.
    let plan = "free";
    let existing: { length: number } | null = null;
    try {
      const me = await api.getMe();
      plan = resolvePlan(me.plan);
    } catch {
      plan = readLocalPlan();
    }
    if (plan === "free") {
      try {
        existing = await api.listCurricula();
      } catch {
        existing = null;
      }
      if (existing && existing.length >= 1) {
        setError(
          "The Starter plan includes 1 active curriculum. Finish or pause your current one, or upgrade to Pro for unlimited goals."
        );
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      await api.generateCurriculum({
        target_topic: payload.target_topic,
        current_level: payload.current_level,
        target_outcome: payload.target_outcome,
        target_deadline: payload.target_deadline,
        hours_per_week: Number(payload.hours_per_week),
        learning_style: payload.learning_style,
      });
      router.push("/curriculum?generated=1");
    } catch (e) {
      setError((e as Error).message || "Generation failed — try again.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6">
      {/* Returning learner shortcut */}
      {existingCount > 0 && (
        <Card className="animate-fade-up mt-4 flex flex-wrap items-center justify-between gap-3 border-accent/40 bg-accent-soft/50 p-4">
          <p className="min-w-0 flex-1 text-xs leading-relaxed">
            You already have {existingCount} curriculum
            {existingCount > 1 ? "s" : ""}. Continue learning instead of
            starting something new?
          </p>
          <Link
            href="/dashboard"
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-accent px-3.5 text-xs font-semibold text-white transition-brightness hover:brightness-110"
          >
            Go to dashboard <ArrowRight className="size-3.5" />
          </Link>
        </Card>
      )}

      {/* Progress header */}
      <div className="animate-fade-up flex items-center justify-between">
        <div>
          <Badge tone="accent" className="mb-2">
            <Sparkles className="size-3" /> The Architect
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">
            Design your curriculum
          </h1>
        </div>
        <span className="text-xs font-medium tabular-nums text-muted">
          Step {step + 1} / {STEPS.length}
        </span>
      </div>
      <TickProgress
        value={((step + 1) / STEPS.length) * 100}
        ticks={20}
        className="mt-4"
      />

      <Card className="mt-6 p-8">
        {step === 0 && (
          <div className="animate-fade-up space-y-6">
            <StepHeader
              icon={<Target className="size-4" />}
              title="What do you want to master?"
              subtitle="Be specific — The Architect prunes content you already know."
            />
            <input
              autoFocus
              value={payload.target_topic}
              onChange={(e) => set("target_topic", e.target.value)}
              placeholder="e.g. Building production RAG systems"
              className="w-full rounded-2xl border border-card-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-accent"
            />
            <textarea
              value={payload.target_outcome}
              onChange={(e) => set("target_outcome", e.target.value)}
              placeholder="Describe your target outcome (optional)…"
              rows={3}
              className="w-full resize-none rounded-2xl border border-card-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-accent"
            />
            <label className="block">
              <span className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <CalendarDays className="size-4 text-muted" /> Target deadline
              </span>
              <input
                type="date"
                value={payload.target_deadline}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => set("target_deadline", e.target.value)}
                className="w-full rounded-2xl border border-card-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-up space-y-5">
            <StepHeader
              icon={<Compass className="size-4" />}
              title="Calibrate your baseline"
              subtitle="Intermediate calibration automatically skips beginner 101 material."
            />
            <div className="grid grid-cols-3 gap-2.5">
              {LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => set("current_level", level)}
                  className={cn(
                    "rounded-2xl border px-4 py-5 text-sm font-medium transition-all",
                    payload.current_level === level
                      ? "border-accent bg-accent-soft text-accent shadow-[0_0_0_1px_var(--accent)]"
                      : "border-card-border text-muted hover:border-accent/40"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
            <div>
              <span className="mb-2 block text-sm font-medium">Learning style</span>
              <div className="space-y-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => set("learning_style", s.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all",
                      payload.learning_style === s.id
                        ? "border-accent bg-accent-soft"
                        : "border-card-border hover:border-accent/40"
                    )}
                  >
                    <span>
                      <span className="block text-sm font-medium">{s.id}</span>
                      <span className="block text-xs text-muted">{s.desc}</span>
                    </span>
                    {payload.learning_style === s.id && (
                      <Check className="size-4 text-accent" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up space-y-6">
            <StepHeader
              icon={<Clock className="size-4" />}
              title="How much time can you commit?"
              subtitle="Your syllabus is reverse-engineered from this constraint."
            />
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => set("hours_per_week", h)}
                  className={cn(
                    "rounded-2xl border px-2 py-4 text-center transition-all",
                    payload.hours_per_week === h
                      ? "border-accent bg-accent-soft text-accent shadow-[0_0_0_1px_var(--accent)]"
                      : "border-card-border text-muted hover:border-accent/40"
                  )}
                >
                  <span className="block text-lg font-bold tabular-nums">{h}</span>
                  <span className="text-[10px] uppercase tracking-wide">h/week</span>
                </button>
              ))}
            </div>
            <p className="rounded-2xl bg-background p-4 text-xs leading-relaxed text-muted">
              At{" "}
              <strong className="text-foreground">
                {payload.hours_per_week} hours/week
              </strong>{" "}
              until{" "}
              <strong className="text-foreground">{payload.target_deadline}</strong>,
              The Architect will schedule roughly{" "}
              <strong className="text-foreground">
                ~{Math.round(payload.hours_per_week / 2)} modules per week
              </strong>{" "}
              and place assessments at weekly checkpoints.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-up space-y-4">
            <StepHeader
              icon={<Sparkles className="size-4" />}
              title="Review & generate"
              subtitle="The Architect will build a week-by-week, day-by-day syllabus."
            />
            <dl className="divide-y divide-card-border overflow-hidden rounded-2xl border border-card-border text-sm">
              <Row label="Topic" value={payload.target_topic || "—"} />
              <Row label="Outcome" value={payload.target_outcome || "—"} />
              <Row label="Deadline" value={payload.target_deadline} />
              <Row label="Baseline" value={payload.current_level} />
              <Row label="Commitment" value={`${payload.hours_per_week} h/week`} />
              <Row label="Style" value={payload.learning_style} />
            </dl>
          </div>
        )}

        {/* Nav buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {error && (
            <p className="text-xs font-medium text-red-500 sm:flex-1">{error}</p>
          )}
          {saving && (
            <p className="text-xs text-muted sm:flex-1">
              The Architect is designing your syllabus — usually 15–40 seconds
              with live sources.
            </p>
          )}
          <div className="flex items-center justify-between gap-3 sm:ml-auto">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Continue <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={generate} disabled={saving}>
                {saving ? "Generating…" : "Generate Syllabus"}
                {!saving && <Sparkles className="size-4" />}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function StepHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-white">
        {icon}
      </span>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="truncate text-right font-medium">{value}</dd>
    </div>
  );
}
