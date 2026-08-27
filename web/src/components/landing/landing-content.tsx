"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Check,
  Compass,
  Flame,
  Hammer,
  Lightbulb,
  Loader2,
  Lock,
  Menu,
  Minus,
  PartyPopper,
  ShieldCheck,
  Target,
  Telescope,
  X,
  Zap,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Card } from "@/components/ui/card";
import { ProductTour } from "@/components/landing/product-tour";
import { ForceLight } from "@/components/landing/force-light";
import { Reveal } from "@/components/landing/reveal";
import { FaqSection } from "@/components/landing/faq-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { StartCta } from "@/components/landing/start-cta";
import { Testimonials } from "@/components/landing/testimonials";
import { MasteryRise, PipelineFlow } from "@/components/landing/illustrations";
import { TickProgress } from "@/components/ui/progress";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";
import { BLOG_POSTS, formatPostDate } from "@/lib/blog-data";

const AGENTS = [
  {
    icon: Compass,
    name: "The Architect",
    tone: "bg-accent text-white",
  },
  {
    icon: Telescope,
    name: "The Hunter",
    tone: "bg-citation-public/15 text-citation-public",
  },
  {
    icon: BookOpenCheck,
    name: "The Synthesizer",
    tone: "bg-accent-soft text-accent",
  },
  {
    icon: ShieldCheck,
    name: "The Fact-Checker",
    tone: "bg-citation-public/15 text-citation-public",
  },
  {
    icon: BrainCircuit,
    name: "The Inquisitor",
    tone: "bg-accent-soft text-accent",
  },
  {
    icon: Hammer,
    name: "The Forge",
    tone: "bg-orange-500/10 text-orange-500",
  },
  {
    icon: Lightbulb,
    name: "The Catalyst",
    tone: "bg-accent-soft text-accent",
  },
] as const;

const STAT_ICONS = [Target, CheckCircle2, Flame];

type CellValue = boolean | string;

const PRICING_TIERS = [
  {
    id: "starter",
    monthly: 0,
    popular: false,
    featureKey: 0,
  },
  {
    id: "pro",
    monthly: 149000,
    popular: true,
    featureKey: 1,
  },
  {
    id: "team",
    monthly: 399000,
    popular: false,
    featureKey: 2,
  },
] as const;

function formatIDR(amount: number) {
  if (amount === 0) return "Rp0";
  return `Rp${new Intl.NumberFormat("id-ID").format(amount)}`;
}

function CompareCell({ value }: { value: CellValue }) {
  if (value === true)
    return <Check className="mx-auto size-4 text-citation-public" aria-label="Yes" />;
  if (value === false)
    return <Minus className="mx-auto size-4 text-muted/50" aria-label="No" />;
  return <span className="text-[11px] text-muted">{value}</span>;
}

export function LandingContent() {
  const { locale, setLocale } = useLocale();
  const c = getCopy("home", locale);
  const api = useApi();
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [capture, setCapture] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");

  async function onCapture(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || capture === "loading") return;
    setCapture("loading");
    try {
      await api.subscribeNewsletter(email);
      setCapture("done");
      setEmail("");
    } catch {
      setCapture("error");
    }
  }

  const mobileLinks: { label: string; href: string }[] = [
    { label: c.navPricing, href: "/#pricing" },
    { label: c.heroSecondaryCta, href: "/#demo" },
    { label: c.agentsEyebrow, href: "/#agents" },
    { label: c.howTitle, href: "/#how" },
    { label: locale === "id" ? "FAQ" : "FAQ", href: "/#faq-anchor" },
  ];

  const comparisonRows: {
    key: string;
    values: [CellValue, CellValue, CellValue];
  }[] = [
    { key: "deadline", values: [true, false, false] },
    { key: "citations", values: [c.cellCitations, false, c.cellChatCitations] },
    { key: "verified", values: [true, false, false] },
    { key: "replan", values: [true, false, c.cellChatReplan] },
    { key: "mastery", values: [true, c.cellQuizOnly, c.cellChatMastery] },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <ForceLight />
      {/* Minimal top bar */}
      <header className="fixed inset-x-0 top-3 z-50 px-3 sm:px-4">
        <nav className="glass-nav mx-auto flex h-12 w-full max-w-4xl items-center justify-between rounded-full border border-card-border bg-card/95 pl-4 pr-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.12)]">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <span className="flex size-6 items-center justify-center rounded-full bg-accent text-[11px] font-extrabold text-white">
              F
            </span>
            Fidya
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/#how"
              className="hidden h-9 items-center rounded-full px-3.5 text-xs font-medium text-muted hover:bg-tick-empty/40 hover:text-foreground md:flex"
            >
              {c.howTitle}
            </Link>
            <Link
              href="/#agents"
              className="hidden h-9 items-center rounded-full px-3.5 text-xs font-medium text-muted hover:bg-tick-empty/40 hover:text-foreground md:flex"
            >
              {c.agentsEyebrow}
            </Link>
            <Link
              href="/#pricing"
              className="hidden h-9 items-center rounded-full px-3.5 text-xs font-medium text-muted hover:bg-tick-empty/40 hover:text-foreground sm:flex"
            >
              {c.navPricing}
            </Link>
            <Link
              href="/sign-in"
              className="hidden h-9 items-center rounded-full px-3.5 text-xs font-medium text-muted hover:bg-tick-empty/40 hover:text-foreground sm:flex"
            >
              {c.navLogin}
            </Link>
            <StartCta className="hidden h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(79,70,229,0.35)] transition-brightness hover:brightness-110 sm:flex">
              {c.navGetStarted} <ArrowRight className="size-3.5" />
            </StartCta>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? c.menuClose : c.menuOpen}
              className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-tick-empty/40 sm:hidden"
            >
              {menuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
            </button>
          </div>
        </nav>
        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="glass-nav mx-auto mt-2 w-full max-w-4xl rounded-3xl border border-card-border bg-card/95 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.18)] sm:hidden">
            <div className="grid gap-1">
              {mobileLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex h-10 items-center rounded-2xl px-3 text-sm font-medium text-foreground transition-colors hover:bg-tick-empty/40"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/sign-in"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 items-center rounded-2xl px-3 text-sm font-medium text-muted transition-colors hover:bg-tick-empty/40"
              >
                {c.navLogin}
              </Link>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-card-border pt-3">
              <span className="flex h-1.5 w-6 items-center" aria-hidden />
              <div className="flex overflow-hidden rounded-full border border-card-border text-[11px] font-semibold">
                {(["en", "id"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLocale(l)}
                    className={
                      locale === l
                        ? "bg-accent px-3 py-1.5 text-white"
                        : "px-3 py-1.5 text-muted"
                    }
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
              <StartCta
                className="ml-auto flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(79,70,229,0.35)]"
              >
                {c.navGetStarted} <ArrowRight className="size-3.5" />
              </StartCta>
            </div>
          </div>
        )}
      </header>

      <main className="relative flex flex-1 flex-col overflow-x-clip">
        {/* Hero — two columns: copy left, live mockup right */}
        <section className="relative mx-auto w-full max-w-6xl px-6 pt-6 pb-16 sm:pt-10">
          <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              {/* Announcement pill */}
              <Link
                href="/changelog"
                className="animate-fade-up group flex items-center gap-2 rounded-full border border-accent/25 bg-accent-soft/60 py-1 pl-1 pr-3 text-[11px] font-medium transition-colors hover:border-accent/50"
              >
                <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  {c.announceTag}
                </span>
                <span className="text-foreground/80">{c.announceText}</span>
                <ArrowUpRight className="size-3 shrink-0 text-accent transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <p className="animate-fade-up mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                {c.heroEyebrow}
              </p>
              <h1 className="animate-fade-up mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">
                {c.heroTitleA}
                <br />
                <span className="text-accent">{c.heroTitleB}</span>
              </h1>
              <p className="animate-fade-up mt-5 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                {c.heroDesc}
              </p>
              <div className="animate-fade-up mt-8 flex flex-col gap-3 sm:flex-row">
                <StartCta className="block">
                  <span className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(79,70,229,0.28)] transition-all hover:brightness-110">
                    {c.heroPrimaryCta}
                    <ArrowRight className="size-4" />
                  </span>
                </StartCta>
                {/* Anchor scroll — plain tag so it always works */}
                <a href="#demo" className="group">
                  <span className="flex h-12 items-center justify-center gap-2 rounded-full border border-card-border bg-card px-7 text-sm font-medium transition-colors group-hover:border-accent/40">
                    {c.heroSecondaryCta}
                    <ArrowUpRight className="size-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                  </span>
                </a>
              </div>

              {/* Mini trust ticks — animated fill */}
              <div className="animate-fade-up mt-8 w-full max-w-sm">
                <TickProgress value={87} ticks={28} animated />
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                  <span>{c.weekLabel}</span>
                  <span>{c.trustTicks}</span>
                </div>
                {/* Usage proof — real traction, not product claims */}
                <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold tabular-nums text-foreground/70">
                  <ShieldCheck className="size-3.5 shrink-0 text-citation-public" />
                  {c.heroProof}
                </p>
              </div>
            </div>

            {/* Interactive product tour */}
            <div id="demo" className="scroll-mt-24 py-6">
              <ProductTour />
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="border-t border-card-border/70">
          <div className="mx-auto w-full max-w-4xl px-6 pb-6 pt-14">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {c.stats.map((s, i) => {
                const StatIcon = STAT_ICONS[i];
                return (
                  <Reveal key={s.stat} delay={i * 120}>
                    <Card className="flex h-full items-start gap-3 p-5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                        <StatIcon className="size-4" />
                      </span>
                      <div>
                        <p className="text-xl font-extrabold tabular-nums tracking-tight">{s.stat}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-muted">{s.label}</p>
                      </div>
                    </Card>
                  </Reveal>
                );
              })}
            </div>
            <p className="mt-4 text-center text-[10px] leading-relaxed text-muted/70">
              {c.statsSource}
            </p>
          </div>
        </section>

        {/* Audience segments + trust bar */}
        <section className="border-t border-card-border/70">
          <div className="mx-auto max-w-4xl px-6 py-10 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
              {c.segmentsLabel}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {c.segments.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="rounded-full border border-card-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent"
                >
                  {s.label}
                </Link>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 text-xs font-semibold tabular-nums text-foreground/70">
              <ShieldCheck className="size-3.5 shrink-0 text-citation-public" />
              {c.trustStats}
            </div>
            <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted/60">
              {c.sourcesLabel} {c.sourcesList}
            </p>
          </div>
        </section>

        {/* Pipeline illustration section — copy left, visual right */}
        <section className="relative mx-auto w-full max-w-5xl scroll-mt-20 px-6 py-16 sm:py-24">
          <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                  {c.pipelineEyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                  {c.pipelineTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {c.pipelineDesc}
                </p>
                <ul className="mt-6 space-y-3.5 text-sm text-muted">
                  {c.pipelinePoints.map((t) => (
                    <li key={t} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-citation-public" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={140}>
              <PipelineFlow />
            </Reveal>
          </div>
        </section>

        {/* Agents bento */}
        <section id="agents" className="border-t border-card-border/70">
          <div className="mx-auto w-full max-w-4xl scroll-mt-20 px-6 py-16 sm:py-20">
            <Reveal>
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                {c.agentsEyebrow}
              </p>
              <h2 className="mt-3 text-center text-2xl font-bold tracking-tight sm:text-3xl">
                {c.agentsTitle}
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted">
                {c.agentsDesc}
              </p>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {AGENTS.map((a, i) => (
                <Reveal key={a.name} delay={(i % 3) * 90}>
                  <Card className="h-full p-6 transition-shadow duration-300 hover:shadow-[0_12px_36px_rgba(15,23,42,0.10)]">
                    <span className={`flex size-10 items-center justify-center rounded-full ${a.tone}`}>
                      <a.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 text-sm font-bold">{a.name}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">{c.agentDescs[i]}</p>
                  </Card>
                </Reveal>
              ))}
              {/* CTA card inside bento */}
              <Reveal delay={180}>
                <StartCta className="block h-full">
                  <Card className="group flex h-full flex-col items-start justify-between bg-accent p-6 text-white transition-transform duration-300 hover:-translate-y-1">
                    <ArrowUpRight className="size-6 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    <div>
                      <h3 className="text-base font-bold">{c.agentsCtaTitle}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-white/80">
                        {c.agentsCtaDesc}
                      </p>
                    </div>
                  </Card>
                </StartCta>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Grounding demo */}
        <section className="relative mx-auto w-full max-w-3xl px-6 pb-20">
          <Reveal>
            <Card className="relative overflow-hidden p-8 sm:p-10">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-citation-public/10 blur-3xl"
              />
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-citation-public">
                <ShieldCheck className="size-3.5" /> {c.integrityEyebrow}
              </p>
              <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                {c.integrityTitle}
              </h2>
              <p className="mt-3 text-sm leading-loose text-muted">
                {c.integrityPart1}
                <span className="mx-0.5 inline-flex size-5 items-center justify-center rounded-md align-super bg-citation-public/10 text-[10px] font-semibold text-citation-public">
                  [1]
                </span>
                {c.integrityMid}
                <span className="mx-0.5 inline-flex size-5 items-center justify-center rounded-md align-super bg-blue-500/10 text-[10px] font-semibold text-blue-500">
                  [2]
                </span>
                {c.integrityPart2}
              </p>
              <div className="mt-5 flex flex-col gap-2 border-t border-card-border pt-4 text-[11px] text-muted sm:flex-row sm:gap-6">
                <span>
                  <span className="font-semibold text-citation-public">[1]</span>{" "}
                  {c.citation1Label}
                </span>
                <span>
                  <span className="font-semibold text-blue-500">[2]</span> {c.citation2Label}
                </span>
              </div>
            </Card>
          </Reveal>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto w-full max-w-4xl scroll-mt-20 px-6 pb-20">
          <Reveal>
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              {c.howTitle}
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {c.howSteps.map((s, i) => (
              <Reveal key={s.step} delay={i * 130}>
                <Card className="h-full p-6">
                  <span className="text-xs font-bold tabular-nums text-accent">{s.step}</span>
                  <h3 className="mt-2 text-sm font-bold">{s.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{s.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section className="border-t border-card-border/70">
          <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
            <Reveal>
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                {c.compareEyebrow}
              </p>
              <h2 className="mt-3 text-center text-2xl font-bold tracking-tight sm:text-3xl">
                {c.compareTitle}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted">
                {c.compareDesc}
              </p>
            </Reveal>
            <Reveal delay={120}>
              <Card className="mt-8 overflow-hidden p-0">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-card-border bg-tick-empty/20">
                      <th className="w-2/5 px-4 py-3 font-semibold sm:px-5" aria-hidden />
                      {c.compareColumns.map((col, i) => (
                        <th
                          key={col}
                          scope="col"
                          className={
                            i === 0
                              ? "px-3 py-3 text-center text-[11px] font-extrabold text-accent"
                              : "px-3 py-3 text-center text-[11px] font-medium text-muted"
                          }
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.key} className="border-b border-card-border last:border-0">
                        <th scope="row" className="px-4 py-3.5 text-xs font-medium leading-snug sm:px-5">
                          {(c.compareRows as Record<string, string>)[row.key]}
                        </th>
                        {row.values.map((v, i) => (
                          <td
                            key={i}
                            className={
                              i === 0
                                ? "bg-accent-soft/30 px-3 py-3.5 text-center align-middle"
                                : "px-3 py-3.5 text-center align-middle"
                            }
                          >
                            <CompareCell value={v} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </Reveal>
          </div>
        </section>

        {/* Mastery illustration section — visual left, copy right */}
        <section className="relative mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
          <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal className="lg:order-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-citation-public">
                  {c.progressEyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                  {c.progressTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {c.progressDesc}
                </p>
                <ul className="mt-6 space-y-3.5 text-sm text-muted">
                  {c.progressPoints.map((t) => (
                    <li key={t} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-strong" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={140} className="lg:order-1">
              <MasteryRise />
            </Reveal>
          </div>
        </section>

        {/* Pricing preview */}
        <section id="pricing" className="border-t border-card-border/70">
          <div className="mx-auto w-full max-w-4xl scroll-mt-20 px-6 py-16 sm:py-20">
            <Reveal>
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                {c.pricingEyebrow}
              </p>
              <h2 className="mt-3 text-center text-2xl font-bold tracking-tight sm:text-3xl">
                {c.pricingTitle}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted">
                {c.pricingDesc}
              </p>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {PRICING_TIERS.map((tier, i) => (
                <Reveal key={tier.id} delay={i * 110}>
                  <Card
                    className={
                      tier.popular
                        ? "relative flex h-full flex-col border-accent/50 p-6 shadow-[0_12px_36px_rgba(79,70,229,0.14)]"
                        : "relative flex h-full flex-col p-6"
                    }
                  >
                    {tier.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                        {c.mostPopular}
                      </span>
                    )}
                    <h3 className="text-sm font-bold">
                      {c.pricingTierNames[tier.id]}
                    </h3>
                    <p className="mt-2">
                      <span className="text-xl font-extrabold tabular-nums tracking-tight">
                        {tier.monthly === 0
                          ? c.pricingFree
                          : formatIDR(tier.monthly)}
                      </span>
                      {tier.monthly > 0 && (
                        <span className="text-[11px] text-muted">
                          {" "}
                          {c.pricingPerMonth}
                        </span>
                      )}
                    </p>
                    <ul className="mt-4 flex-1 space-y-2 text-xs text-muted">
                      {c.pricingFeatures[tier.featureKey].map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent-strong" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {tier.id === "team" ? (
                      <Link
                        href="/contact"
                        className="mt-5 flex h-10 items-center justify-center rounded-full border border-card-border px-5 text-xs font-medium transition-colors hover:border-accent/40"
                      >
                        {c.pricingCtas[tier.featureKey]}
                      </Link>
                    ) : (
                      <StartCta className="mt-5 block">
                        <span
                          className={
                            tier.popular
                              ? "flex h-10 w-full items-center justify-center rounded-full bg-accent px-5 text-xs font-semibold text-white transition-all hover:brightness-110"
                              : "flex h-10 items-center justify-center rounded-full border border-card-border px-5 text-xs font-medium transition-colors hover:border-accent/40"
                          }
                        >
                          {c.pricingCtas[tier.featureKey]}
                        </span>
                      </StartCta>
                    )}
                  </Card>
                </Reveal>
              ))}
            </div>
            {/* Guarantee + security strip */}
            <Reveal delay={140}>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/subscribe#guarantee"
                  className="group flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent-soft/40 p-4 transition-colors hover:border-accent/50"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                    <Zap className="size-4" />
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold">
                      {c.guaranteeTitle}
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                      {c.guaranteeDesc}
                    </p>
                  </div>
                </Link>
                <Link
                  href="/security"
                  className="group flex items-start gap-3 rounded-2xl border border-card-border p-4 transition-colors hover:border-accent/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tick-empty/40 text-muted group-hover:text-accent">
                    <Lock className="size-4" />
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold">
                      {c.securityLink}
                      <ArrowUpRight className="size-3 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                      {c.securityLine}
                    </p>
                  </div>
                </Link>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 text-center">
                <Link
                  href="/subscribe"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent underline-offset-4 hover:underline"
                >
                  {c.viewAllPricing} <ArrowRight className="size-3.5" />
                </Link>
              </p>
            </Reveal>
          </div>
        </section>

        {/* Blog & changelog teasers */}
        <section className="border-t border-card-border/70">
          <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-20">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                    {c.insightsEyebrow}
                  </p>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    {c.insightsTitle}
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <Link
                    href="/blog"
                    className="inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline"
                  >
                    {c.viewAllPosts} <ArrowUpRight className="size-3.5" />
                  </Link>
                  <Link
                    href="/changelog"
                    className="inline-flex items-center gap-1 text-muted underline-offset-4 hover:text-accent hover:underline"
                  >
                    {c.viewChangelog} <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </Reveal>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {BLOG_POSTS.slice(0, 3).map((post, i) => {
                const teaser = {
                  title: post.title[locale],
                  excerpt: post.excerpt[locale],
                  date: formatPostDate(post, locale),
                };
                return (
                  <Reveal key={post.title.en} delay={i * 110}>
                    <Link href="/blog" className="group block h-full">
                      <Card className="flex h-full flex-col p-5 transition-shadow duration-300 group-hover:shadow-[0_12px_36px_rgba(15,23,42,0.10)]">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                          {teaser.date}
                        </p>
                        <h3 className="mt-2 text-sm font-bold leading-snug group-hover:text-accent">
                          {teaser.title}
                        </h3>
                        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted">
                          {teaser.excerpt}
                        </p>
                      </Card>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials wall */}
        <Testimonials />

        {/* FAQ */}
        <FaqSection />

        {/* Final CTA */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-slate-800/20 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 px-8 py-16 text-center text-white sm:px-16 sm:py-20">
              {/* Blueprint grid pattern */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)",
                  backgroundSize: "44px 44px",
                  maskImage:
                    "radial-gradient(ellipse 70% 80% at 50% 60%, black, transparent)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 70% 80% at 50% 60%, black, transparent)",
                }}
              />
              {/* Accent glow */}
              <div
                aria-hidden
                className="absolute -bottom-32 left-1/2 size-[30rem] -translate-x-1/2 rounded-full bg-accent/25 blur-3xl"
              />

              <p className="relative text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300">
                {c.finalEyebrow}
              </p>
              <h2 className="relative mx-auto mt-4 max-w-xl text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                {c.finalTitle}
              </h2>
              <p className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/65">
                {c.finalDesc}
              </p>

              <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <StartCta className="w-full sm:w-auto">
                  <span className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-bold text-slate-900 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all hover:scale-[1.02] hover:bg-indigo-50">
                    {c.finalPrimary} <ArrowRight className="size-4" />
                  </span>
                </StartCta>
                <Link href="/subscribe" className="w-full sm:w-auto">
                  <span className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-8 text-sm font-semibold text-white backdrop-blur transition-colors hover:border-white/50 hover:bg-white/10">
                    {c.finalSecondary}
                  </span>
                </Link>
              </div>

              <div className="relative mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] font-medium text-white/55">
                {c.finalAssurances.map((t, i) =>
                  i === 2 ? (
                    <Link
                      key={t}
                      href="/subscribe#guarantee"
                      className="flex items-center gap-1.5 underline-offset-2 hover:text-white hover:underline"
                    >
                      <Zap className="size-3.5 text-indigo-300" />
                      {t}
                    </Link>
                  ) : (
                    <span key={t} className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-citation-public" />
                      {t}
                    </span>
                  )
                )}
              </div>

              {/* Email capture — low-commitment fallback for visitors not ready to sign up */}
              <div className="relative mx-auto mt-8 max-w-md border-t border-white/10 pt-6">
                <p className="text-[11px] text-white/55">{c.captureLead}</p>
                <form
                  onSubmit={onCapture}
                  className="mx-auto mt-3 flex w-full max-w-sm gap-2"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (capture !== "loading") setCapture("idle");
                    }}
                    placeholder={c.capturePlaceholder}
                    aria-label="Email address"
                    className="h-10 w-full min-w-0 flex-1 rounded-full border border-white/20 bg-white/5 px-4 text-xs text-white outline-none backdrop-blur transition-colors placeholder:text-white/40 focus:border-white/50"
                  />
                  <button
                    type="submit"
                    disabled={capture === "loading"}
                    className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-slate-900 transition-colors hover:bg-indigo-50 disabled:opacity-80"
                  >
                    {capture === "idle" && c.captureButton}
                    {capture === "loading" && (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />{" "}
                        {c.captureSending}
                      </>
                    )}
                    {capture === "done" && (
                      <>
                        <Check className="size-3.5" /> {c.captureSubscribed}
                      </>
                    )}
                    {capture === "error" && (
                      <>
                        <PartyPopper className="size-3.5" /> {c.captureTryAgain}
                      </>
                    )}
                  </button>
                </form>
                {capture === "error" && (
                  <p className="mt-2 text-[11px] text-red-300">
                    {c.captureTryAgain}
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />

      {/* Spacer so the sticky mobile CTA never covers footer content */}
      <div aria-hidden className="h-[4.25rem] sm:hidden" />

      {/* Sticky mobile CTA — always-visible conversion path on small screens */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-card-border bg-card/95 px-4 py-3 backdrop-blur sm:hidden">
        <StartCta className="block w-full">
          <span className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-white shadow-[0_2px_12px_rgba(79,70,229,0.35)] transition-all hover:brightness-110">
            {c.heroPrimaryCta}
            <ArrowRight className="size-4" />
          </span>
        </StartCta>
      </div>
    </div>
  );
}
