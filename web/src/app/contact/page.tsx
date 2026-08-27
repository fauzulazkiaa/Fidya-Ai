"use client";

import { useState } from "react";
import { LifeBuoy, Mail, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/marketing/page-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

export default function ContactPage() {
  const { locale } = useLocale();
  const c = getCopy("contact", locale);
  const [topic, setTopic] = useState<string>(c.topics[0]);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const subject = `[${topic}] ${message.slice(0, 60)}…`;
    const body = `${message}\n\n—\nFrom: ${email}`;
    window.location.href = `mailto:support@fidya.ai?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: LifeBuoy, ...c.cards[0] },
          { icon: Send, ...c.cards[1] },
          { icon: MapPin, ...c.cards[2] },
        ].map((card) => (
          <Card key={card.title} className="p-5">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
              <card.icon className="size-4" />
            </span>
            <h2 className="mt-3 text-sm font-bold">{card.title}</h2>
            {card.href ? (
              <a
                href={card.href}
                className="mt-0.5 block text-xs text-accent underline underline-offset-2"
              >
                {card.line}
              </a>
            ) : (
              <p className="mt-0.5 text-xs font-medium">{card.line}</p>
            )}
            <p className="text-[11px] text-muted">{card.desc}</p>
          </Card>
        ))}
      </section>

      <Card className="p-6 sm:p-8">
        <h2 className="text-sm font-bold">{c.formTitle}</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="topic"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted"
            >
              {c.topic}
            </label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-10 w-full cursor-pointer rounded-xl border border-card-border bg-background px-3 text-xs outline-none focus:border-accent"
            >
              {c.topics.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="c-email"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted"
            >
              {c.yourEmail}
            </label>
            <input
              id="c-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-10 w-full rounded-xl border border-card-border bg-background px-3 text-xs outline-none focus:border-accent"
            />
          </div>
          <div>
            <label
              htmlFor="c-msg"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted"
            >
              {c.message}
            </label>
            <textarea
              id="c-msg"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={c.messagePlaceholder}
              className="w-full resize-none rounded-xl border border-card-border bg-background p-3 text-xs outline-none focus:border-accent"
            />
          </div>
          <Button type="submit">
            <Mail className="size-4" /> {c.send}
          </Button>
        </form>
      </Card>
    </PageShell>
  );
}
