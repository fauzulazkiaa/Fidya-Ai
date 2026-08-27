"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Clock,
  Loader2,
  PlayCircle,
  Users,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/marketing/page-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { getCopy } from "@/lib/seo-copy";

export function WebinarsContent() {
  const { locale } = useLocale();
  const c = getCopy("webinars", locale);
  const api = useApi();
  const { toast } = useToast();
  const [openEvent, setOpenEvent] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [registered, setRegistered] = useState<Set<string>>(new Set());

  function toggleForm(key: string) {
    setOpenEvent((cur) => (cur === key ? null : key));
    setEmail("");
  }

  async function apply(e: React.FormEvent, key: string) {
    e.preventDefault();
    if (!email.includes("@") || loadingKey) return;
    setLoadingKey(key);
    try {
      await api.subscribeNewsletter(email, "webinars");
      setRegistered((prev) => new Set(prev).add(key));
      setOpenEvent(null);
      setEmail("");
      toast({ tone: "success", title: c.successTitle, desc: c.successDesc });
    } catch {
      toast({ tone: "warning", title: c.errorTitle });
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <section className="space-y-4">
        <h2 className="text-lg font-bold">{c.upcoming}</h2>
        <div className="grid gap-4">
          {c.events.map((event) => {
            const key = event.title;
            const isRegistered = registered.has(key);
            return (
              <Card key={key} className="flex flex-col gap-4 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <Video className="size-4" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {event.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {event.time}
                        </span>
                        <Badge tone="accent">{event.format}</Badge>
                        {event.inviteOnly && (
                          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                            {c.inviteOnly}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1.5 text-sm font-bold leading-snug">
                        {event.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted">
                        {event.host} ·{" "}
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3" />
                          {event.spots} {c.spotsLeft}
                        </span>
                      </p>
                    </div>
                  </div>
                  {event.inviteOnly ? (
                    <Link
                      href="/contact"
                      className="shrink-0 self-start rounded-full border border-card-border px-5 py-2.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent sm:self-auto"
                    >
                      {c.requestInvitation}
                    </Link>
                  ) : isRegistered ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-citation-public/10 px-4 py-2 text-xs font-semibold text-citation-public sm:self-auto">
                      <Check className="size-3.5" />
                      {c.registered}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleForm(key)}
                      className="shrink-0 self-start rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-110 sm:self-auto"
                    >
                      {c.apply}
                    </button>
                  )}
                </div>
                {!event.inviteOnly && !isRegistered && (
                  openEvent === key && (
                    <form
                      onSubmit={(e) => apply(e, key)}
                      className="flex flex-col gap-2 border-t border-dashed border-card-border pt-4 sm:flex-row"
                    >
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        aria-label={c.apply}
                        className="h-10 w-full min-w-0 flex-1 rounded-full border border-card-border bg-background px-4 text-xs outline-none transition-colors placeholder:text-muted focus:border-accent"
                      />
                      <button
                        type="submit"
                        disabled={loadingKey === key}
                        className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent px-5 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-80"
                      >
                        {loadingKey === key ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />{" "}
                            {c.applying}
                          </>
                        ) : (
                          c.apply
                        )}
                      </button>
                    </form>
                  ))}
                </Card>
              );
          })}
        </div>
        <p className="text-[11px] leading-relaxed text-muted">{c.newsletterNote}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">{c.past}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {c.recordings.map((rec) => (
            <Card key={rec.title} className="flex flex-col p-5 opacity-75">
              <span className="flex size-9 items-center justify-center rounded-full bg-tick-empty/40 text-muted">
                <PlayCircle className="size-4" />
              </span>
              <h3 className="mt-3 text-sm font-bold leading-snug">{rec.title}</h3>
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
                <Clock className="size-3" />
                {c.duration}: {rec.duration} · {rec.date}
              </p>
              <p className="mt-3 rounded-full border border-dashed border-card-border px-3 py-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted/70">
                {c.recordingSoon}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
