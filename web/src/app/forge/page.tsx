"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Copy, PanelRightClose, PanelRightOpen, Swords } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApi, type Curriculum, type ForgeReviewResult } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "auto", label: "Auto" },
  { id: "code", label: "Code" },
  { id: "essay", label: "Essay" },
  { id: "design", label: "Design" },
] as const;

type SubmissionType = (typeof MODES)[number]["id"];

export default function ForgePage() {
  const [mode, setMode] = useState<SubmissionType>("auto");
  const [code, setCode] = useState("");
  const api = useApi();
  const [review, setReview] = useState<ForgeReviewResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [showPane, setShowPane] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  // The Forge adapts to whatever the learner is currently studying —
  // across ALL active curricula, not a fixed subject.
  const [curricula, setCurricula] = useState<Curriculum[] | null>(null);
  useEffect(() => {
    api.listCurricula().then(setCurricula).catch(() => {});
  }, [api]);
  const context =
    curricula?.find((c) => c.modules.some((m) => m.status === "in_progress"))
      ?.target_topic ??
    curricula?.[0]?.target_topic ??
    "";

  async function runReview() {
    if (running) return;
    if (!code.trim()) {
      setError("Tulis atau tempel dulu karya yang ingin di-review.");
      return;
    }
    setRunning(true);
    setReview(null);
    setError("");
    setShowPane(true);
    try {
      const result = await api.forgeReview(mode, code, context);
      setReview(result.review);
    } catch (e) {
      setError(
        `Review gagal: ${(e as Error).message.replace(/^API \d+:\s*/, "")}`
      );
    } finally {
      setRunning(false);
    }
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <header className="animate-fade-up flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-accent text-white">
            <Swords className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Forge Review</h1>
            <p className="text-xs text-muted">
              Stress-test any work — line-level critique
              {context ? (
                <>
                  {" "}· tailored to{" "}
                  <span className="font-medium text-accent">{context}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center rounded-full border border-card-border p-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  mode === m.id
                    ? "bg-accent text-white"
                    : "text-muted hover:text-accent"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={showPane ? "Hide review pane" : "Show review pane"}
            onClick={() => setShowPane((s) => !s)}
            className="hidden lg:inline-flex"
          >
            {showPane ? (
              <PanelRightClose className="size-4" />
            ) : (
              <PanelRightOpen className="size-4" />
            )}
          </Button>
          <Button onClick={runReview} disabled={running || !code.trim()}>
            {running ? "Stress-testing…" : "Run Review"}
          </Button>
        </div>
      </header>

      {error && (
        <Card className="animate-fade-up mt-4 flex items-start gap-3 border-red-500/30 bg-red-500/5 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-red-600 dark:text-red-400">
            {error}
          </p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setError("")}
            className="shrink-0 text-xs text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </Card>
      )}

      {/* Split screen */}
      <div
        className={cn(
          "mt-5 grid animate-fade-up gap-5",
          showPane ? "lg:grid-cols-2" : "lg:grid-cols-1"
        )}
      >
        {/* Left: editor */}
        <Card className="flex min-h-[420px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-card-border px-4 py-2.5">
            <span className="font-mono text-xs text-muted">submission</span>
            <Badge>{code.trim() ? (mode === "essay" ? `${code.trim().split(/\s+/).length} words` : `${code.split("\n").length} lines`) : "empty"}</Badge>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            placeholder={
              "Paste anything you're working on — code, an essay, a design, notes for your current subject.\n\nThe Forge adapts its critique to what you're studying."
            }
            className="scrollbar-thin flex-1 resize-none bg-background p-5 font-mono text-[13px] leading-relaxed outline-none placeholder:text-muted"
          />
        </Card>

        {/* Right: feedback */}
        {showPane && (
          <Card className="scrollbar-thin min-h-[420px] overflow-y-auto p-6">
            {running && (
              <div className="space-y-5" aria-busy>
                <div className="space-y-2">
                  <div className="skeleton h-4 w-24" />
                  <div className="skeleton h-3.5 w-full" />
                  <div className="skeleton h-3.5 w-5/6" />
                </div>
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="skeleton h-4 w-32" />
                    <div className="skeleton h-14 w-full rounded-2xl" />
                    <div className="skeleton h-14 w-full rounded-2xl" />
                  </div>
                ))}
                <div className="space-y-2">
                  <div className="skeleton h-4 w-20" />
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3"
                    >
                      <div className="skeleton h-3 w-24 shrink-0" />
                      <div className="flex flex-1 gap-[3px]">
                        {[...Array(5)].map((__, j) => (
                          <span
                            key={j}
                            className={cn(
                              "h-2.5 flex-1 rounded-full",
                              j <= i ? "bg-accent/40" : "bg-tick-empty"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!running && !review && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Swords className="size-7" />
                </span>
                <p className="mt-4 text-sm font-semibold">
                  Feedback stream appears here
                </p>
                <p className="mt-1 max-w-xs text-xs text-muted">
                  Submit your work to receive structured critique with exact
                  refactor suggestions.
                </p>
              </div>
            )}

            {!running && review && (
              <div className="animate-fade-up space-y-5">
                <div>
                  <h2 className="text-sm font-semibold">Summary</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {review.summary}
                  </p>
                </div>

                <Section title="Strengths" tone="public">
                  {review.strengths.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-citation-public" />
                      {s}
                    </li>
                  ))}
                </Section>

                <Section title="Vulnerabilities" tone="destructive">
                  {review.vulnerabilities.map((v, i) => (
                    <li key={i} className="rounded-2xl border border-card-border p-3">
                      {v.line !== undefined && (
                        <Badge className="mr-2 font-mono">L{v.line}</Badge>
                      )}
                      {v.paragraph !== undefined && (
                        <Badge className="mr-2 font-mono">¶{v.paragraph}</Badge>
                      )}
                      <span className="text-sm leading-relaxed">{v.note}</span>
                    </li>
                  ))}
                </Section>

                <Section title="Suggested Refactors" tone="accent">
                  {review.suggested_refactors.map((r) => (
                    <li key={r.title} className="overflow-hidden rounded-2xl border border-card-border">
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs font-medium">{r.title}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copy(r.diff, r.title)}
                        >
                          {copied === r.title ? (
                            <>
                              <Check className="size-3" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" /> Copy diff
                            </>
                          )}
                        </Button>
                      </div>
                      <pre className="scrollbar-thin overflow-x-auto bg-background p-3 font-mono text-[11px] leading-relaxed text-muted">
                        {r.diff}
                      </pre>
                    </li>
                  ))}
                </Section>

                <div>
                  <h3 className="mb-2 text-sm font-semibold">Rubric</h3>
                  <ul className="space-y-2">
                    {review.rubric_scores.map((r) => (
                      <li key={r.name} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 text-xs text-muted">
                          {r.name}
                        </span>
                        <div className="flex flex-1 gap-[3px]">
                          {[...Array(r.max)].map((_, i) => (
                            <span
                              key={i}
                              className={cn(
                                "h-2.5 flex-1 rounded-full",
                                i < r.score ? "bg-accent-strong" : "bg-tick-empty"
                              )}
                            />
                          ))}
                        </div>
                        <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums">
                          {r.score}/{r.max}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "public" | "accent" | "destructive";
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span
          className={cn("size-2 rounded-full", {
            public: "bg-citation-public",
            accent: "bg-accent",
            destructive: "bg-red-500",
          }[tone])}
        />
        {title}
      </h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}
