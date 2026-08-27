"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  CreditCard,
  Flame,
  LifeBuoy,
  Mail,
  MousePointerClick,
  Settings,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TickProgress } from "@/components/ui/progress";
import { ProBadge } from "@/components/ui/pro-badge";
import { cn } from "@/lib/utils";
import {
  useApi,
  type Curriculum,
  type ProgressData,
} from "@/hooks/use-api";
import { useFidyaAuth } from "@/hooks/use-fidya-auth";
import { isPro, readLocalPlan } from "@/lib/plan";

export default function ProfilePage() {
  const [curricula, setCurricula] = useState<Curriculum[] | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [plan, setPlan] = useState(() => readLocalPlan());
  const { user } = useFidyaAuth();
  const api = useApi();
  const displayName = user?.displayName ?? "Learner";
  const initials = user?.initials ?? "U";
  const email = user?.email ?? "—";

  useEffect(() => {
    api.listCurricula().then(setCurricula).catch(() => setCurricula([]));
    api.getProgress().then(setProgress).catch(() => {});
    Promise.resolve().then(async () => {
      // Local choice wins unless the backend reports a persisted paid plan.
      try {
        const me = await api.getMe();
        if (me.plan && me.plan !== "free") setPlan(me.plan);
      } catch {
        /* backend unreachable — keep cached plan */
      }
    });
  }, [api]);

  if (!curricula) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mt-4 h-64 animate-pulse rounded-3xl bg-tick-empty/40" />
      </div>
    );
  }

  // Most recently created active curriculum is the featured one.
  const featured =
    curricula.find((c) => (c as { status?: string }).status !== "paused") ??
    curricula[0];
  const completed = progress?.modules_completed ?? 0;
  const total = progress?.modules_total ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 sm:px-6">
      {/* Header card */}
      <Card className="animate-fade-up relative overflow-hidden">
        <div
          aria-hidden
          className="h-24 border-b border-card-border bg-accent-soft"
        />
        <div className="flex flex-col gap-5 px-4 pb-6 sm:flex-row sm:items-end sm:px-6">
          {/* Google-style pro ring around the avatar */}
          <span
            className={cn(
              "mx-auto -mt-12 flex shrink-0 items-center justify-center rounded-full sm:mx-0",
              isPro(plan)
                ? "bg-gradient-to-br from-accent to-accent-strong p-[4px] shadow-[0_2px_12px_rgba(79,70,229,0.35)]"
                : "bg-card p-1"
            )}
          >
            <span className="flex size-[88px] items-center justify-center rounded-full bg-accent text-2xl font-extrabold text-white">
              {initials}
            </span>
          </span>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{displayName}</h1>
              {plan === "free" ? (
                <Badge tone="neutral">
                  <Award className="size-3" /> Starter
                </Badge>
              ) : (
                <ProBadge plan={plan} />
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
              <Mail className="size-3.5" /> {email}
            </p>
          </div>
          <div className="flex shrink-0 gap-2 pb-1 sm:pb-1 [&>a]:flex-1 sm:[&>a]:flex-none">
            <Link href="/settings">
              <Button variant="secondary" size="sm">
                <Settings className="size-3.5" /> Settings
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button size="sm">New Goal</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <section className="grid animate-fade-up grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={<Flame className="size-4" />} label="Day Streak" value={String(progress?.streak_days ?? 0)} />
        <StatCard icon={<Zap className="size-4" />} label="Hours Studied" value={`${progress?.hours_studied ?? 0}h`} />
        <StatCard icon={<BookOpen className="size-4" />} label="Modules Done" value={`${completed}/${total}`} />
        <StatCard icon={<MousePointerClick className="size-4" />} label="Citation Clicks" value={String(progress?.citation_clicks ?? 0)} />
      </section>

      {/* Current curriculum */}
      {featured && (
        <Card className="animate-fade-up p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Active Curriculum
              </p>
              <h2 className="mt-0.5 truncate text-base font-semibold">
                {featured.target_topic}
              </h2>
            </div>
            <Link href={`/curriculum?id=${featured.curriculum_id}`}>
              <Button variant="ghost" size="sm">
                Open <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <TickProgress value={progress?.overall_completion ?? 0} ticks={28} />
            <span className="shrink-0 text-sm font-bold tabular-nums">
              {progress?.overall_completion ?? 0}%
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
            <Meta label="Level" value={featured.current_level} />
            <Meta label="Commitment" value={`${featured.hours_per_week} h/week`} />
            <Meta label="Style" value={featured.learning_style} />
            <Meta
              label="Deadline"
              value={new Date(featured.target_deadline + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            />
          </dl>
          {curricula.length > 1 && (
            <p className="mt-3 text-[11px] text-muted">
              +{curricula.length - 1} more curriculum
              {curricula.length > 2 ? "s" : ""} in{" "}
              <Link href="/curriculum" className="underline underline-offset-2">
                My Curriculum
              </Link>
            </p>
          )}
        </Card>
      )}

      {/* Quick links */}
      <section className="grid animate-fade-up gap-4 sm:grid-cols-3">
        <QuickLink
          href="/subscribe"
          icon={<CreditCard className="size-4" />}
          title="Subscription"
          desc={`Current plan: ${plan === "free" ? "Starter" : plan === "pro" ? "Pro Learner" : "Team"}`}
        />
        <QuickLink
          href="/settings"
          icon={<Settings className="size-4" />}
          title="Settings"
          desc="Account, theme & notifications"
        />
        <QuickLink
          href="/help"
          icon={<LifeBuoy className="size-4" />}
          title="Help Center"
          desc="FAQs and support"
        />
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-lg font-bold tabular-nums leading-tight">{value}</p>
        <p className="text-[11px] text-muted">{label}</p>
      </div>
    </Card>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="group flex h-full items-center gap-3 p-5 transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent transition-transform group-hover:scale-110">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="truncate text-xs text-muted">{desc}</p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
      </Card>
    </Link>
  );
}
