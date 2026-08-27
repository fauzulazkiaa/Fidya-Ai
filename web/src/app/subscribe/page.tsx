"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Crown,
  Minus,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProBadge } from "@/components/ui/pro-badge";
import { useApi } from "@/hooks/use-api";
import { readLocalPlan } from "@/lib/plan";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

const PLANS: {
  id: string;
  name: string;
  icon: typeof Sparkles;
  monthly: number;
  yearly: number;
  popular?: boolean;
}[] = [
  {
    id: "free",
    name: "Starter",
    icon: Sparkles,
    monthly: 0,
    yearly: 0,
  },
  {
    id: "pro",
    name: "Pro Learner",
    icon: Crown,
    monthly: 149000,
    yearly: 1490000,
    popular: true,
  },
  {
    id: "team",
    name: "Team",
    icon: Users,
    monthly: 399000,
    yearly: 3990000,
  },
];

const TRUST_ICONS = {
  shield: ShieldCheck,
  zap: Zap,
  badge: BadgeCheck,
} as const;

function formatIDR(n: number, freeLabel: string) {
  if (n === 0) return freeLabel;
  return `Rp${n.toLocaleString("id-ID")}`;
}

function Cell({ value }: { value: boolean | string }) {
  if (value === true)
    return <Check className="mx-auto size-4 text-citation-public" />;
  if (value === false) return <Minus className="mx-auto size-4 text-muted/50" />;
  return <span className="text-xs font-medium tabular-nums">{value}</span>;
}

export default function SubscribePage() {
  const { locale } = useLocale();
  const c = getCopy("subscribe", locale);
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApi();
  const [yearly, setYearly] = useState(false);
  const [current, setCurrent] = useState("free");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    Promise.resolve().then(() => {
      setCurrent(readLocalPlan());
    });
  }, []);

  function choosePlan(planId: string) {
    // Optimistic: local plan drives gating & badges instantly; the backend
    // persists it in the background (migration 002 adds the users.plan
    // column — until then the localStorage mirror keeps everything working).
    setCurrent(planId);
    localStorage.setItem("fidya.plan", planId);
    try {
      const raw = localStorage.getItem("fidya.settings");
      const s = raw ? JSON.parse(raw) : {};
      localStorage.setItem(
        "fidya.settings",
        JSON.stringify({ ...s, plan: planId })
      );
    } catch {
      /* noop */
    }
    if (isSignedIn) api.updatePlan(planId).catch(() => {});
    setNotice(
      planId === "free" ? c.noticeFree : c.noticePaid
    );
    setTimeout(() => setNotice(""), 4000);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <header className="animate-fade-up mx-auto max-w-2xl text-center">
        <Badge tone="accent" className="mb-4">
          <Crown className="size-3" /> {c.badge}
        </Badge>
        <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          {c.title}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-pretty text-sm leading-relaxed text-muted">
          {c.lead}
        </p>

        {/* Billing toggle */}
        <div className="mt-7 inline-flex items-center gap-1 rounded-full border border-card-border bg-card p-1 shadow-sm">
          {(["monthly", "yearly"] as const).map((mode) => {
            const active = (mode === "yearly") === yearly;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setYearly(mode === "yearly")}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-full px-4 text-xs font-medium capitalize transition-colors",
                  active ? "bg-accent text-white" : "text-muted hover:text-foreground"
                )}
              >
                {c.billing[mode]}
                {mode === "yearly" && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      active ? "bg-white/20 text-white" : "bg-citation-public/10 text-citation-public"
                    )}
                  >
                    −17%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Plans */}
      <section className="mt-10 grid animate-fade-up gap-5 md:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan, idx) => {
          const isCurrent = current === plan.id;
          return (
            <Card
              key={plan.id}
              style={{ animationDelay: `${idx * 70}ms` }}
              className={cn(
                "relative flex animate-fade-up flex-col p-7 transition-all",
                plan.popular
                  ? "border-accent/50 shadow-[0_0_50px_rgba(79,70,229,0.14)] ring-1 ring-accent/30 lg:-my-2 lg:py-9"
                  : "hover:border-accent/40 hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)]",
                isCurrent && "ring-1 ring-citation-public/40"
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_2px_10px_rgba(79,70,229,0.4)]">
                  {c.mostPopular}
                </span>
              )}
              {isCurrent && !plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-citation-public px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                  {c.currentPlan}
                </span>
              )}

              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    plan.popular ? "bg-accent text-white" : "bg-accent-soft text-accent"
                  )}
                >
                  <plan.icon className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-sm font-bold">{plan.name}</h2>
                  <p className="text-[11px] text-muted">{(c.taglines as Record<string, string>)[plan.id]}</p>
                </div>
              </div>

              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold tabular-nums tracking-tight">
                  {formatIDR(yearly && plan.yearly > 0 ? Math.round(plan.yearly / 12) : plan.monthly, c.freeLabel)}
                </span>
                {plan.monthly > 0 && (
                  <span className="text-xs text-muted">{c.perMonth}</span>
                )}
              </div>
              <p className="mt-1 h-4 text-[11px] text-muted">
                {yearly && plan.yearly > 0
                  ? `${formatIDR(plan.yearly, c.freeLabel)} ${c.billedYearly}`
                  : plan.popular
                    ? c.billedMonthlySwitch
                    : ""}
              </p>

              <ul className="mt-6 flex-1 space-y-2.5 border-t border-card-border pt-5">
                {((c.features as Record<string, string[]>)[plan.id] ?? []).map((f: string) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] leading-snug">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-citation-public" />
                    {f}
                  </li>
                ))}
              </ul>

              {isLoaded && !isSignedIn ? (
                <Link href="/sign-up" className="mt-6 block">
                  <Button
                    variant={plan.popular ? "primary" : "secondary"}
                    className="w-full"
                  >
                    {plan.id === "free" ? c.startFree : c.tryPlan.replace("{name}", plan.name)}
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  variant={
                    isCurrent
                      ? "secondary"
                      : plan.popular
                        ? "primary"
                        : "secondary"
                  }
                  className="mt-6 w-full"
                  disabled={isCurrent}
                  onClick={() => choosePlan(plan.id)}
                >
                  {isCurrent ? (
                    <>
                      <BadgeCheck className="size-4" /> {c.currentPlan}
                    </>
                  ) : plan.id === "free" ? (
                    c.switchToStarter
                  ) : (
                    c.upgradeTo.replace("{name}", plan.name)
                  )}
                </Button>
              )}
            </Card>
          );
        })}
      </section>

      {notice && (
        <Card className="animate-toast-in mt-5 flex items-center justify-center gap-2 border-citation-public/30 bg-citation-public/5 p-3.5 text-center">
          <BadgeCheck className="size-4 shrink-0 text-citation-public" />
          <p className="text-xs font-medium text-citation-public">{notice}</p>
        </Card>
      )}

      {/* Comparison matrix */}
      <section aria-label={c.comparisonAria} className="animate-fade-up mt-14">
        <h2 className="text-center text-lg font-bold tracking-tight">
          {c.comparisonHeading}
        </h2>
        <p className="mt-1 text-center text-xs text-muted">
          {c.comparisonLead}
        </p>
        <Card className="mt-6 overflow-hidden p-0">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-card-border bg-background/60">
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {c.featureHeader}
                  </th>
                  {["Starter", "Pro", "Team"].map((name, i) => (
                    <th
                      key={name}
                      className={cn(
                        "px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider",
                        i === 1 ? "bg-accent-soft/60 text-accent" : "text-muted"
                      )}
                    >
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.comparison.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-card-border/60 last:border-0"
                  >
                    <td className="px-5 py-3 text-[13px]">{row.feature}</td>
                    {[row.free, row.pro, row.team].map((v, i) => (
                      <td
                        key={i}
                        className={cn(
                          "px-4 py-3 text-center",
                          i === 1 && "bg-accent-soft/40"
                        )}
                      >
                        <Cell value={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Trust strip */}
      <section
        id="guarantee"
        aria-label="Guarantees"
        className="animate-fade-up mt-10 grid scroll-mt-24 gap-4 sm:grid-cols-3"
      >
        {c.trust.map((t) => {
          const TrustIcon = TRUST_ICONS[t.icon as keyof typeof TRUST_ICONS];
          return (
            <Card key={t.title} className="flex items-start gap-3.5 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <TrustIcon className="size-4.5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">{t.title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  {t.desc}
                </p>
              </div>
            </Card>
          );
        })}
      </section>

      {/* FAQ */}
      <section aria-label={c.faqAria} className="animate-fade-up mt-14">
        <h2 className="text-center text-lg font-bold tracking-tight">
          {c.faqHeading}
        </h2>
        <div className="mx-auto mt-6 max-w-2xl space-y-2.5">
          {c.faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-card-border bg-card transition-colors open:border-accent/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <p className="border-t border-card-border px-5 py-4 text-xs leading-relaxed text-muted">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <Card className="animate-fade-up mt-14 flex flex-col items-center gap-4 border-accent/30 bg-accent-soft/50 p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-white">
          <Crown className="size-5" />
        </span>
        <h2 className="max-w-md text-xl font-extrabold tracking-tight sm:text-2xl">
          {c.ctaTitle}
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          {c.ctaLead}
        </p>
        {isLoaded && !isSignedIn ? (
          <Link href="/sign-up">
            <Button size="lg" variant="secondary" className="font-semibold">
              {c.ctaStartFree} <ArrowRight className="size-4" />
            </Button>
          </Link>
        ) : (
          <Button
            size="lg"
            variant="secondary"
            className="font-semibold"
            onClick={() => choosePlan(current === "pro" ? "team" : "pro")}
          >
            {current === "free"
              ? c.ctaUpgradePro
              : current === "pro"
                ? c.ctaUpgradeTeam
                : c.ctaManage}
            <ArrowRight className="size-4" />
          </Button>
        )}
        <ProBadge plan={current} />
      </Card>
    </div>
  );
}
