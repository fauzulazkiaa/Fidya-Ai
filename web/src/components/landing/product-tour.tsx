"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  Flame,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

const STEP_MS = 4200;

export function ProductTour() {
  const { locale } = useLocale();
  const c = getCopy("tour", locale);
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState("");
  const frameRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [engaged, setEngaged] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Honor prefers-reduced-motion: no auto-advance, no tilt, full text shown.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Auto-advance through the tour — pauses while the visitor is hovering or
  // focusing inside the frame so nobody loses their place mid-read, and can
  // be stopped entirely with the explicit play/pause control.
  useEffect(() => {
    if (!autoPlay || engaged || reducedMotion) return;
    const t = setInterval(
      () => setStep((s) => (s + 1) % c.stepLabels.length),
      STEP_MS
    );
    return () => clearInterval(t);
  }, [autoPlay, c.stepLabels.length, engaged, reducedMotion]);

  // Typing animation during step 0
  useEffect(() => {
    if (step !== 0 || reducedMotion) return;
    let i = 0;
    const t = setInterval(() => {
      if (i === 0) setTyped("");
      i += 1;
      setTyped(c.goalText.slice(0, i));
      if (i >= c.goalText.length) clearInterval(t);
    }, 85);
    return () => clearInterval(t);
  }, [step, c.goalText, reducedMotion]);

  const shownText =
    step === 0 && reducedMotion ? c.goalText : typed;

  function onMouseMove(e: React.MouseEvent) {
    if (reducedMotion) return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * 6, y: px * 8 });
    setParallax({ x: px, y: py });
  }

  return (
    <div
      ref={frameRef}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setEngaged(true)}
      onMouseLeave={() => {
        setEngaged(false);
        setTilt({ x: 0, y: 0 });
        setParallax({ x: 0, y: 0 });
      }}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={() => setEngaged(false)}
      className="relative mx-auto w-full max-w-xl"
      style={{ perspective: "1400px" }}
    >
      {/* Ambient glow follows parallax */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-accent/10 blur-3xl transition-transform duration-300"
        style={{
          transform: `translate(${parallax.x * 30}px, ${parallax.y * 30}px)`,
        }}
      />

      {/* Glass badge — grounded (top right, above the frame) */}
      <div
        aria-hidden
        className="glass-nav absolute -top-5 right-6 z-20 hidden items-center gap-1.5 rounded-full border border-white/50 bg-white/55 px-3.5 py-1.5 shadow-lg sm:flex"
        style={{
          transform: `translate(${parallax.x * -26}px, ${parallax.y * -22}px)`,
          transition: "transform 150ms ease-out",
        }}
      >
        <ShieldCheck className="size-3.5 text-citation-public" />
        <span className="text-[10px] font-bold text-foreground">
          {c.groundedBadge}
        </span>
      </div>

      {/* Window */}
      <div
        className="relative overflow-hidden rounded-3xl border border-card-border bg-card shadow-2xl transition-[transform] duration-200 ease-out will-change-transform"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${
            tilt.x || tilt.y ? 1.015 : 1
          })`,
        }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-card-border bg-tick-empty/20 px-4 py-2.5">
          <span className="flex gap-1.5">
            <i className="size-2.5 rounded-full bg-red-400" />
            <i className="size-2.5 rounded-full bg-yellow-400" />
            <i className="size-2.5 rounded-full bg-green-400" />
          </span>
          <span key={step} className="animate-fade-up mx-auto flex h-6 w-52 items-center justify-center rounded-full bg-card text-[10px] font-medium text-muted ring-1 ring-card-border">
            fidya.ai{URLS[step]}
          </span>
          <span className="w-10" />
        </div>

        {/* Step body */}
        <div className="h-[400px] overflow-hidden p-5 sm:h-[420px] sm:p-6">
          {step === 0 && <StepGoal typed={shownText} />}
          {step === 1 && <StepLevel />}
          {step === 2 && <StepTime />}
          {step === 3 && <StepGenerate />}
          {step === 4 && <StepDashboard />}
        </div>

        {/* Step dots / controls */}
        <div className="flex items-center justify-center gap-2 border-t border-card-border bg-tick-empty/20 py-3">
          <button
            type="button"
            onClick={() => setAutoPlay((v) => !v)}
            aria-label={autoPlay ? c.tourPause : c.tourPlay}
            title={autoPlay ? c.tourPause : c.tourPlay}
            className="flex size-5 items-center justify-center rounded-full text-muted transition-colors hover:text-accent"
          >
            {autoPlay ? (
              <Pause className="size-3" />
            ) : (
              <Play className="size-3" />
            )}
          </button>
          {c.stepLabels.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step
                  ? "w-7 bg-accent"
                  : "w-1.5 bg-tick-empty hover:bg-muted"
              )}
              aria-label={`${c.goToStep}${label}`}
            />
          ))}
          <span className="ml-2 text-[9px] font-medium uppercase tracking-wider text-muted">
            {c.stepLabels[step]}
          </span>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-muted">
        {c.caption}
      </p>
    </div>
  );
}

const URLS = [
  "/onboarding",
  "/onboarding",
  "/onboarding",
  "/onboarding",
  "/dashboard",
];

/* DOM selectors the cursor presses at each step (measured live) */
/* data-tour attributes remain on step elements for future automation */

/* --------------------------------------------------------------- step views */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </p>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold">{title}</h3>
      <p className="text-[11px] text-muted">{subtitle}</p>
    </div>
  );
}

function StepGoal({ typed }: { typed: string }) {
  const { locale } = useLocale();
  const root = getCopy("tour", locale);
  const c = root.goalStep;
  const done = typed.length >= root.goalText.length;
  return (
    <div>
      <StepHeader title={c.title} subtitle={c.subtitle} />
      <div className="rounded-2xl border border-accent bg-background px-4 py-3 text-xs shadow-[0_0_0_3px_var(--accent-soft)]">
        {typed || <span className="text-muted">{c.placeholder}</span>}
        {!done && <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse-dot bg-accent align-middle" />}
      </div>
      <div className="mt-4 opacity-0 transition-opacity duration-500" style={{ opacity: done ? 1 : 0 }}>
        <FieldLabel>{c.outcomeLabel}</FieldLabel>
        <div className="rounded-2xl border border-card-border bg-background px-4 py-3 text-[11px] text-muted">
          {c.outcome}
        </div>
        <label className="mt-4 block">
          <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
            <CalendarDays className="size-3" /> {c.deadlineLabel}
          </span>
          <div className="rounded-2xl border border-card-border bg-background px-4 py-3 text-xs font-medium">
            {c.deadline}
          </div>
        </label>
      </div>
      <button
        data-tour="continue"
        className={cn(
          "mt-5 flex h-9 items-center gap-2 rounded-full bg-accent px-5 text-[11px] font-semibold text-white transition-opacity",
          done ? "opacity-100" : "opacity-40"
        )}
      >
        {c.continue}
      </button>
    </div>
  );
}

function StepLevel() {
  const { locale } = useLocale();
  const c = getCopy("tour", locale).levelStep;
  const [picked, setPicked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPicked(true), 1100);
    return () => clearTimeout(t);
  }, []);
  return (
    <div>
      <StepHeader title={c.title} subtitle={c.subtitle} />
      <div className="grid grid-cols-3 gap-2.5">
        {c.levels.map((lv, i) => (
          <div
            key={lv}
            data-tour={i === 1 ? "level-intermediate" : undefined}
            className={cn(
              "rounded-2xl border px-3 py-5 text-center text-xs font-medium transition-all duration-300",
              picked && i === 1
                ? "border-accent bg-accent-soft text-accent shadow-[0_0_0_3px_var(--accent-soft)]"
                : "border-card-border text-muted"
            )}
          >
            {lv}
            {picked && i === 1 && (
              <Check className="mx-auto mt-1 size-3 animate-fade-up" />
            )}
          </div>
        ))}
      </div>
      <div
        className="mt-4 space-y-2 transition-opacity duration-500"
        style={{ opacity: picked ? 1 : 0.35 }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          {c.styleLabel}
        </p>
        <div className="flex items-center justify-between rounded-2xl border border-accent bg-accent-soft px-4 py-3 text-[11px] font-medium">
          {c.styleProject}
          <Check className="size-3.5 text-accent" />
        </div>
        <div className="rounded-2xl border border-card-border px-4 py-3 text-[11px] text-muted">
          {c.styleReading}
        </div>
      </div>
    </div>
  );
}

function StepTime() {
  const { locale } = useLocale();
  const c = getCopy("tour", locale).timeStep;
  const [picked, setPicked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPicked(true), 1000);
    return () => clearTimeout(t);
  }, []);
  const hours = [4, 6, 10, 12, 15, 20];
  return (
    <div>
      <StepHeader title={c.title} subtitle={c.subtitle} />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {hours.map((h) => (
          <div
            key={h}
            data-tour={h === 12 ? "hours-12" : undefined}
            className={cn(
              "rounded-2xl border py-4 text-center transition-all duration-300",
              picked && h === 12
                ? "border-accent bg-accent-soft text-accent shadow-[0_0_0_3px_var(--accent-soft)]"
                : "border-card-border"
            )}
          >
            <p className={cn("text-base font-extrabold tabular-nums", picked && h === 12 ? "text-accent" : "text-muted")}>
              {h}
            </p>
            <p className="text-[8px] uppercase tracking-wide text-muted">{c.hoursUnit}</p>
          </div>
        ))}
      </div>
      <div
        className="mt-5 rounded-2xl bg-background p-4 text-[11px] leading-relaxed text-muted transition-opacity duration-500"
        style={{ opacity: picked ? 1 : 0 }}
      >
        {c.notePre}
        <strong className="text-foreground">{c.noteHours}</strong>
        {c.noteMid}
        <strong className="text-foreground">{c.noteDate}</strong>
        {c.notePost}
      </div>
    </div>
  );
}

function StepGenerate() {
  const { locale } = useLocale();
  const c = getCopy("tour", locale).generateStep;
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setGenerating(true), 900);
    const t2 = setTimeout(() => {
      setGenerating(false);
      setDone(true);
    }, 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return (
    <div>
      <StepHeader title={c.title} subtitle={c.subtitle} />
      <div className="divide-y divide-card-border overflow-hidden rounded-2xl border border-card-border text-[11px]">
        {c.rows.map(([k, v]) => (
          <div key={k} className="flex justify-between px-4 py-2.5">
            <span className="text-muted">{k}</span>
            <span className="font-medium">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <div
          data-tour="generate"
          className={cn(
            "flex h-10 items-center gap-2 rounded-full px-6 text-xs font-semibold transition-all",
            done
              ? "bg-citation-public text-white"
              : generating
                ? "bg-accent/70 text-white"
                : "bg-accent text-white"
          )}
        >
          {done ? (
            <>
              <Check className="size-4" /> {c.ready}
            </>
          ) : generating ? (
            <>
              <Sparkles className="size-4 animate-pulse-dot" /> {c.generating}
            </>
          ) : (
            <>
              <Sparkles className="size-4" /> {c.generate}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDashboard() {
  const { locale } = useLocale();
  const c = getCopy("tour", locale).dashboardStep;
  const pcts = [100, 60, 0];
  return (
    <div className="animate-fade-up space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">{c.greeting}</p>
          <p className="text-[10px] text-muted">
            {c.weekReady}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-bold text-accent">
          <Zap className="size-3" /> {c.dayBadge}
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-2xl border border-orange-500/25 bg-orange-500/5 p-3.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-orange-500/15 text-orange-500">
          <Flame className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">{c.streakTitle}</p>
          <p className="text-[10px] text-muted">{c.streakDesc}</p>
        </div>
      </div>

      {c.modules.map((m, i) => (
        <div
          key={m.title}
          data-tour={i === 0 ? "module-first" : undefined}
          className="animate-fade-up rounded-2xl border border-card-border p-4"
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-wider text-muted">
                {c.weekPrefix}
                {i + 1} · {m.status}
              </p>
              <p className="mt-1 truncate text-xs font-bold">{m.title}</p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex flex-1 gap-[2px]">
              {Array.from({ length: 14 }, (_, t) => (
                <span
                  key={t}
                  className={cn(
                    "h-2 flex-1 rounded-[1px] transition-colors duration-500",
                    t < Math.round((pcts[i] / 100) * 14)
                      ? "bg-accent-strong"
                      : "bg-tick-empty"
                  )}
                  style={{ transitionDelay: `${i * 150 + t * 40}ms` }}
                />
              ))}
            </div>
            <span className="w-8 text-right text-[9px] font-bold tabular-nums">
              {pcts[i]}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
